// src/main/java/com/quamtechs/steevacare/dto/request/UpdateAppointmentStatusRequest.java
package com.quamtechs.steevacare.dto.request;

import com.quamtechs.steevacare.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAppointmentStatusRequest(
    @NotNull(message = "Le statut est obligatoire")
    AppointmentStatus status,

    String motifRejet
) {}
