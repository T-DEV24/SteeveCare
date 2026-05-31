// src/main/java/com/quamtechs/steevacare/dto/response/PrescriptionResponse.java
package com.quamtechs.steevacare.dto.response;

import java.time.LocalDateTime;

public record PrescriptionResponse(
    Long id,
    String medicaments,
    String posologie,
    String instructions,
    Integer dureeJours,
    String codeRetrait,
    Boolean delivree,
    LocalDateTime dateDelivraison,
    LocalDateTime createdAt,
    String patientNom,
    String patientPrenom,
    String medecinNom
) {}
