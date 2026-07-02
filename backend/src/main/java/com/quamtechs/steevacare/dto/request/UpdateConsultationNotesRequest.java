// src/main/java/com/quamtechs/steevacare/dto/request/UpdateConsultationNotesRequest.java
package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateConsultationNotesRequest(
    @Size(max = 10000, message = "Les notes médecin ne peuvent pas dépasser 10000 caractères")
    String notesMedecin
) {}
