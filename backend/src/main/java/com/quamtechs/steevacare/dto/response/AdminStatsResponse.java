// src/main/java/com/quamtechs/steevacare/dto/response/AdminStatsResponse.java
package com.quamtechs.steevacare.dto.response;

public record AdminStatsResponse(
    long totalPatients,
    long totalDoctors,
    long totalPharmacies,
    long totalAdmins,
    long comptesPending,
    long comptesFrozen,
    long totalAppointments,
    long appointmentsToday
) {}
