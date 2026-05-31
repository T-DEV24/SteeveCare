// src/main/java/com/quamtechs/steevacare/service/AdminService.java
package com.quamtechs.steevacare.service;

import com.quamtechs.steevacare.dto.request.CreateUserRequest;
import com.quamtechs.steevacare.dto.response.AdminStatsResponse;
import com.quamtechs.steevacare.dto.response.UserResponse;
import com.quamtechs.steevacare.entity.Doctor;
import com.quamtechs.steevacare.entity.Pharmacy;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PharmacyRepository pharmacyRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Création de compte ───────────────────────────────────────────────

    @Transactional
    public UserResponse createUser(CreateUserRequest req, Long creatorId) {
        // 1. Récupérer le créateur et valider ses droits
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Créateur introuvable"));

        validateCreationRights(creator.getRole(), req.role());

        // 2. Vérifier unicité de l'email
        if (userRepository.existsByEmail(req.email())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Cet email est déjà utilisé par un autre compte.");
        }

        // 3. Créer l'utilisateur
        User user = User.builder()
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .role(req.role())
            .status(AccountStatus.ACTIVE)
            .nom(req.nom())
            .prenom(req.prenom())
            .telephone(req.telephone())
            .createdBy(creatorId)
            .build();
        user = userRepository.save(user);

        // 4. Créer le profil spécifique selon le rôle
        if (req.role() == Role.DOCTOR) {
            if (req.specialite() == null || req.specialite().isBlank()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                    "La spécialité est obligatoire pour un médecin");
            }
            Doctor doctor = Doctor.builder()
                .user(user)
                .specialite(req.specialite())
                .numeroOrdre(req.numeroOrdre())
                .tarif(req.tarif())
                .ville(req.villeMedecin())
                .anneesExperience(req.anneesExperience())
                .biographie(req.biographie())
                .build();
            doctorRepository.save(doctor);
        }

        if (req.role() == Role.PHARMACY) {
            if (req.nomPharmacie() == null || req.nomPharmacie().isBlank()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                    "Le nom de la pharmacie est obligatoire");
            }
            Pharmacy pharmacy = Pharmacy.builder()
                .user(user)
                .nomPharmacie(req.nomPharmacie())
                .adresse(req.adressePharmacie())
                .ville(req.villePharmacie())
                .numeroAutorisation(req.numeroAutorisation())
                .build();
            pharmacyRepository.save(pharmacy);
        }

        log.info("Compte {} créé par {} pour {}", req.role(), creator.getEmail(), req.email());
        return toUserResponse(user);
    }

    // ── Geler un compte ──────────────────────────────────────────────────

    @Transactional
    public UserResponse freezeAccount(Long userId, Long adminId) {
        User user = getUserOrThrow(userId);
        validateTargetNotSuperAdmin(user);

        if (user.getId().equals(adminId)) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Vous ne pouvez pas geler votre propre compte");
        }
        if (user.getStatus() == AccountStatus.FROZEN) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Ce compte est déjà gelé");
        }

        user.setStatus(AccountStatus.FROZEN);
        return toUserResponse(userRepository.save(user));
    }

    // ── Dégeler un compte ────────────────────────────────────────────────

    @Transactional
    public UserResponse unfreezeAccount(Long userId) {
        User user = getUserOrThrow(userId);

        if (user.getStatus() != AccountStatus.FROZEN) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Ce compte n'est pas gelé");
        }

        user.setStatus(AccountStatus.ACTIVE);
        return toUserResponse(userRepository.save(user));
    }

    // ── Supprimer définitivement (SUPER_ADMIN uniquement, soft-delete) ───

    @Transactional
    public void deleteUser(Long userId) {
        User user = getUserOrThrow(userId);
        validateTargetNotSuperAdmin(user);

        // Soft-delete : anonymisation de l'email + statut DELETED
        user.setStatus(AccountStatus.DELETED);
        user.setEmail("deleted_" + userId + "@steevacare.deleted");
        userRepository.save(user);

        log.info("Compte {} supprimé définitivement (soft-delete)", userId);
    }

    // ── Stats dashboard ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminStatsResponse getDashboardStats() {
        return new AdminStatsResponse(
            userRepository.countByRoleAndStatusNot(Role.PATIENT, AccountStatus.DELETED),
            userRepository.countByRoleAndStatusNot(Role.DOCTOR, AccountStatus.DELETED),
            userRepository.countByRoleAndStatusNot(Role.PHARMACY, AccountStatus.DELETED),
            userRepository.countByRoleAndStatusNot(Role.ADMIN, AccountStatus.DELETED),
            userRepository.countByStatus(AccountStatus.PENDING),
            userRepository.countByStatus(AccountStatus.FROZEN),
            appointmentRepository.count(),
            appointmentRepository.countToday()
        );
    }

    // ── Liste des utilisateurs ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAllByStatusNot(AccountStatus.DELETED)
            .stream()
            .map(this::toUserResponse)
            .collect(Collectors.toList());
    }

    // ── Méthodes privées ─────────────────────────────────────────────────

    private void validateCreationRights(Role creatorRole, Role targetRole) {
        boolean allowed = switch (creatorRole) {
            case SUPER_ADMIN -> true;
            case ADMIN -> Set.of(
                Role.DOCTOR, Role.PHARMACY, Role.GESTIONNAIRE, Role.ADMIN
            ).contains(targetRole);
            case GESTIONNAIRE -> Set.of(
                Role.DOCTOR, Role.PHARMACY
            ).contains(targetRole);
            default -> false;
        };

        if (!allowed) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Vous n'avez pas le droit de créer un compte de type " + targetRole.name());
        }
    }

    private void validateTargetNotSuperAdmin(User target) {
        if (target.getRole() == Role.SUPER_ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Impossible de modifier ou supprimer un compte Super Administrateur");
        }
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Utilisateur introuvable avec l'identifiant : " + userId));
    }

    public UserResponse toUserResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getNom(),
            user.getPrenom(),
            user.getTelephone(),
            user.getPhotoUrl(),
            user.getRole(),
            user.getStatus(),
            user.getCreatedAt()
        );
    }
}
