// src/main/java/com/quamtechs/steevacare/dto/websocket/VideoSignalMessage.java
package com.quamtechs.steevacare.dto.websocket;

import java.util.Map;

public record VideoSignalMessage(
    String roomId,
    String type,
    String senderId,
    Map<String, Object> payload
) {}
