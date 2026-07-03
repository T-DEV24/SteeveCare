package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Données communes modifiables par tout utilisateur connecté depuis sa page Profil.
 */
public record UpdateUserProfileRequest(
    @Size(max = 100) String nom,
    @Size(max = 100) String prenom,
    @Email String email,
    @Size(max = 30) String telephone,
    String dateNaissance,
    @Size(max = 120) String ville
) {}
