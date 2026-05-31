// src/main/java/com/quamtechs/steevacare/dto/response/MessageResponse.java
package com.quamtechs.steevacare.dto.response;

import java.time.LocalDateTime;

public record MessageResponse(
    Long id,
    Long senderId,
    String senderNom,
    String senderPrenom,
    Long receiverId,
    String contenu,
    LocalDateTime timestamp,
    Boolean isRead,
    Long appointmentId
) {}
