// src/main/java/com/quamtechs/steevacare/service/AuthService.java
package com.quamtechs.steevacare.service;

import com.quamtechs.steevacare.dto.request.LoginRequest;
import com.quamtechs.steevacare.dto.request.RegisterPatientRequest;
import com.quamtechs.steevacare.dto.response.AuthResponse;
import com.quamtechs.steevacare.entity.Patient;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.PatientRepository;
import com.quamtechs.steevacare.repository.UserRepository;
import com.quamtechs.steevacare.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // ── Inscription Patient ──────────────────────────────────────────────

    @Transactional
    public AuthResponse registerPatient(RegisterPatientRequest req) {
        // 1. Vérifier unicité de l'email
        if (userRepository.existsByEmail(req.email())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.");
        }

        // 2. Créer l'utilisateur
        User user = User.builder()
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .role(Role.PATIENT)
            .status(AccountStatus.ACTIVE)
            .nom(req.nom())
            .prenom(req.prenom())
            .telephone(req.telephone())
            .build();
        user = userRepository.save(user);

        // 3. Créer le profil patient associé
        Patient patient = Patient.builder()
            .user(user)
            .ville(req.ville())
            .sexe(req.sexe())
            .build();
        patientRepository.save(patient);

        log.info("Nouveau patient inscrit : {}", user.getEmail());

        // 4. Générer les tokens et retourner la réponse
        return buildAuthResponse(user);
    }

    // ── Connexion ────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest req) {
        // 1. Chercher l'utilisateur par email
        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED,
                "Email ou mot de passe incorrect"));

        // 2. Vérifier le mot de passe
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED,
                "Email ou mot de passe incorrect");
        }

        // 3. Vérifier le statut du compte
        if (user.getStatus() == AccountStatus.FROZEN) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Votre compte a été suspendu. Contactez l'administration.");
        }
        if (user.getStatus() == AccountStatus.DELETED) {
            throw new AppException(HttpStatus.NOT_FOUND,
                "Ce compte n'existe plus.");
        }
        if (user.getStatus() == AccountStatus.PENDING) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Votre compte est en attente de validation.");
        }

        log.info("Connexion réussie pour : {}", user.getEmail());

        // 4. Générer et retourner les tokens
        return buildAuthResponse(user);
    }

    // ── Méthode utilitaire ───────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return new AuthResponse(
            user.getId(),
            user.getEmail(),
            user.getNom(),
            user.getPrenom(),
            user.getRole(),
            user.getStatus(),
            accessToken,
            refreshToken,
            "Bearer"
        );
    }
}
