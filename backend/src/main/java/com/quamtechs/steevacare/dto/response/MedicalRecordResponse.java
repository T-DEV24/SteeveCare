package com.quamtechs.steevacare.dto.response;

import java.time.LocalDateTime;

/**
 * DTO public du dossier médical, sans relation JPA patient afin d'éviter la
 * sérialisation de proxys Hibernate lazy et l'exposition de données utilisateur.
 */
public record MedicalRecordResponse(
    Long id,
    String antecedentsFamiliaux,
    String traitementEnCours,
    String vaccinations,
    LocalDateTime updatedAt
) {}
