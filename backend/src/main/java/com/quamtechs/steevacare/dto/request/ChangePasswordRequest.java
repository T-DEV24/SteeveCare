package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Requête de changement de mot de passe avec vérification du mot de passe actuel.
 */
public record ChangePasswordRequest(
    @NotBlank String oldPassword,
    @NotBlank @Size(min = 8) String newPassword
) {}
