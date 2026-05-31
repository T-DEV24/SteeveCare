// src/main/java/com/quamtechs/steevacare/dto/response/AuthResponse.java
package com.quamtechs.steevacare.dto.response;

import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;

public record AuthResponse(
    Long id,
    String email,
    String nom,
    String prenom,
    Role role,
    AccountStatus status,
    String accessToken,
    String refreshToken,
    String tokenType
) {}
