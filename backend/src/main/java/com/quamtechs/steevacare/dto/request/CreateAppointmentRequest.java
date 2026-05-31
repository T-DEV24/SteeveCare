// src/main/java/com/quamtechs/steevacare/dto/request/CreateAppointmentRequest.java
package com.quamtechs.steevacare.dto.request;

import com.quamtechs.steevacare.enums.ConsultationType;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record CreateAppointmentRequest(
    @NotNull(message = "L'identifiant du médecin est obligatoire")
    Long doctorId,

    @NotNull(message = "La date et heure sont obligatoires")
    @Future(message = "La date du rendez-vous doit être dans le futur")
    LocalDateTime dateHeure,

    @NotNull(message = "Le type de consultation est obligatoire")
    ConsultationType type,

    @NotBlank(message = "Le motif est obligatoire")
    @Size(min = 10, max = 500, message = "Le motif doit contenir entre 10 et 500 caractères")
    String motif
) {}
