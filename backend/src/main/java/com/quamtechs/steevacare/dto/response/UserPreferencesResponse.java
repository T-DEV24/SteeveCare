package com.quamtechs.steevacare.dto.response;

/**
 * Préférences de l'espace utilisateur retournées au frontend Profil.
 */
public record UserPreferencesResponse(
    boolean emailNotifications,
    boolean darkMode,
    String language
) {}
