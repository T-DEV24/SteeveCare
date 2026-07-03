package com.quamtechs.steevacare.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

/**
 * Requête de création d'ordonnance liée à une consultation ou, à défaut, à un rendez-vous.
 */
public record CreatePrescriptionRequest(
    Long consultationId,
    Long appointmentId,
    @NotNull JsonNode medicaments,
    String posologie,
    String instructions,
    Integer dureeJours,
    Long pharmacyId,
    Boolean transmiseAPharmacie
) {}
