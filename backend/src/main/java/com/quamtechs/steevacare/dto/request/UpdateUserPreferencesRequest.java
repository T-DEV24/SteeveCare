package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.Pattern;

/**
 * Préférences simples de l'espace utilisateur, persistées sur le compte.
 */
public record UpdateUserPreferencesRequest(
    Boolean emailNotifications,
    Boolean darkMode,
    @Pattern(regexp = "fr|en", message = "La langue doit être 'fr' ou 'en'") String language
) {}
