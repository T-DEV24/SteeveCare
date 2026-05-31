// src/main/java/com/quamtechs/steevacare/dto/response/DoctorProfileResponse.java
package com.quamtechs.steevacare.dto.response;

import com.quamtechs.steevacare.enums.AccountStatus;

import java.math.BigDecimal;

public record DoctorProfileResponse(
    Long id,
    Long userId,
    String nom,
    String prenom,
    String photoUrl,
    String specialite,
    String numeroOrdre,
    String biographie,
    BigDecimal tarif,
    String ville,
    Integer anneesExperience,
    AccountStatus status
) {}
