package com.quamtechs.steevacare.dto.response;

/**
 * Résumé d'une pharmacie active sélectionnable pour le retrait d'une ordonnance.
 */
public record PharmacySummaryResponse(
    Long id,
    String nom,
    String prenom,
    String ville,
    String adresse,
    String telephone
) {}
