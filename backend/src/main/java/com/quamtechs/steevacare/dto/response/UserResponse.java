// src/main/java/com/quamtechs/steevacare/dto/response/UserResponse.java
package com.quamtechs.steevacare.dto.response;

import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String email,
    String nom,
    String prenom,
    String telephone,
    String photoUrl,
    Role role,
    AccountStatus status,
    LocalDateTime createdAt
) {}
