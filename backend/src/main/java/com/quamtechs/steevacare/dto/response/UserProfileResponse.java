package com.quamtechs.steevacare.dto.response;

import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;

import java.time.LocalDateTime;

/**
 * Profil complet de l'utilisateur connecté, sans exposer l'entité JPA ni le mot de passe.
 */
public record UserProfileResponse(
    Long id,
    String email,
    String nom,
    String prenom,
    String telephone,
    String photoUrl,
    String avatarUrl,
    String dateNaissance,
    String ville,
    UserPreferencesResponse preferences,
    Role role,
    AccountStatus status,
    LocalDateTime createdAt
) {}
