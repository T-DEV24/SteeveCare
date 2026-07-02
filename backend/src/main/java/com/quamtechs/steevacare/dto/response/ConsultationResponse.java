// src/main/java/com/quamtechs/steevacare/dto/response/ConsultationResponse.java
package com.quamtechs.steevacare.dto.response;

import com.quamtechs.steevacare.enums.AppointmentStatus;
import com.quamtechs.steevacare.enums.ConsultationType;

import java.time.LocalDateTime;

public record ConsultationResponse(
    Long id,
    Long appointmentId,
    Long patientId,
    String patientNom,
    String patientPrenom,
    Long doctorId,
    String doctorNom,
    String doctorPrenom,
    LocalDateTime dateHeure,
    AppointmentStatus statutRendezVous,
    ConsultationType type,
    String motif,
    String notesMedecin,
    LocalDateTime debutAt,
    LocalDateTime finAt,
    Integer dureeReelle
) {}
