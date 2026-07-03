package com.quamtechs.steevacare.service;

import com.quamtechs.steevacare.dto.request.ChangePasswordRequest;
import com.quamtechs.steevacare.dto.request.UpdateUserPreferencesRequest;
import com.quamtechs.steevacare.dto.request.UpdateUserProfileRequest;
import com.quamtechs.steevacare.dto.response.UserPreferencesResponse;
import com.quamtechs.steevacare.dto.response.UserProfileResponse;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of("image/png", "image/jpeg", "image/webp");
    private static final Path AVATAR_DIR = Path.of("uploads", "avatars");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(Long userId) {
        return toProfileResponse(getActiveUser(userId));
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateUserProfileRequest request) {
        User user = getActiveUser(userId);
        user.setNom(blankToNull(request.nom()));
        user.setPrenom(blankToNull(request.prenom()));
        user.setTelephone(blankToNull(request.telephone()));
        user.setDateNaissance(blankToNull(request.dateNaissance()));
        user.setVille(blankToNull(request.ville()));
        return toProfileResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getActiveUser(userId);
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "L'ancien mot de passe est incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Mot de passe modifié pour l'utilisateur {}", user.getEmail());
    }

    @Transactional
    public UserProfileResponse updateAvatar(Long userId, MultipartFile avatar) {
        User user = getActiveUser(userId);
        if (avatar == null || avatar.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Aucun fichier avatar fourni");
        }
        if (!ALLOWED_AVATAR_TYPES.contains(avatar.getContentType())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Format d'avatar non supporté (PNG, JPG ou WEBP attendu)");
        }

        try {
            Files.createDirectories(AVATAR_DIR);
            String extension = extensionFor(avatar.getContentType());
            String filename = user.getId() + "-" + UUID.randomUUID() + extension;
            Path destination = AVATAR_DIR.resolve(filename).normalize();
            Files.copy(avatar.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            user.setPhotoUrl("/uploads/avatars/" + filename);
            return toProfileResponse(userRepository.save(user));
        } catch (IOException ex) {
            log.error("Impossible de stocker l'avatar de l'utilisateur {}", userId, ex);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de stocker l'avatar");
        }
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(Long userId, UpdateUserPreferencesRequest request) {
        User user = getActiveUser(userId);
        user.setEmailNotifications(Boolean.TRUE.equals(request.emailNotifications()));
        user.setDarkMode(Boolean.TRUE.equals(request.darkMode()));
        user.setLanguage(request.language() == null || request.language().isBlank() ? "fr" : request.language());
        userRepository.save(user);
        return toPreferencesResponse(user);
    }

    @Transactional
    public void deactivateMyAccount(Long userId) {
        User user = getActiveUser(userId);
        user.setStatus(AccountStatus.FROZEN);
        userRepository.save(user);
        log.info("Compte utilisateur {} désactivé par son propriétaire", user.getEmail());
    }

    private User getActiveUser(Long userId) {
        return userRepository.findById(userId)
            .filter(user -> user.getStatus() != AccountStatus.DELETED)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    public UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getNom(),
            user.getPrenom(),
            user.getTelephone(),
            user.getPhotoUrl(),
            user.getPhotoUrl(),
            user.getDateNaissance(),
            user.getVille(),
            toPreferencesResponse(user),
            user.getRole(),
            user.getStatus(),
            user.getCreatedAt()
        );
    }

    private UserPreferencesResponse toPreferencesResponse(User user) {
        return new UserPreferencesResponse(
            Boolean.TRUE.equals(user.getEmailNotifications()),
            Boolean.TRUE.equals(user.getDarkMode()),
            user.getLanguage() == null ? "fr" : user.getLanguage()
        );
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            default -> ".png";
        };
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
