// src/main/java/com/quamtechs/steevacare/dto/response/AppointmentResponse.java
package com.quamtechs.steevacare.dto.response;

import com.quamtechs.steevacare.enums.AppointmentStatus;
import com.quamtechs.steevacare.enums.ConsultationType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AppointmentResponse(
    Long id,
    // Infos patient
    Long patientId,
    String patientNom,
    String patientPrenom,
    // Infos médecin
    Long doctorId,
    String doctorNom,
    String doctorPrenom,
    String doctorSpecialite,
    BigDecimal doctorTarif,
    // Détails RDV
    LocalDateTime dateHeure,
    Integer dureePrevue,
    AppointmentStatus statut,
    ConsultationType type,
    String motif,
    String motifRejet,
    LocalDateTime createdAt
) {}
