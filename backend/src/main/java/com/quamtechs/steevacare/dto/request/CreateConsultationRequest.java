// src/main/java/com/quamtechs/steevacare/dto/request/CreateConsultationRequest.java
package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateConsultationRequest(
    @NotNull(message = "L'identifiant du rendez-vous est obligatoire")
    Long appointmentId,

    @Size(max = 10000, message = "Les notes médecin ne peuvent pas dépasser 10000 caractères")
    String notesMedecin
) {}
