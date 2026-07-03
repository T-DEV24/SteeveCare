package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.NotNull;

public record WebSocketChatMessageRequest(
    @NotNull(message = "Le destinataire est obligatoire")
    Long receiverId,
    Object payload
) {}
