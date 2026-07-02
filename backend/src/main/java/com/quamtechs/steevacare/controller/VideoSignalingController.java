// src/main/java/com/quamtechs/steevacare/controller/VideoSignalingController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.websocket.VideoSignalMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class VideoSignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * WebSocket /app/consultations.video — Relaye les signaux WebRTC (offer, answer, ice, hangup)
     * vers /topic/consultations/{roomId}/video pour la salle de consultation.
     */
    @MessageMapping("/consultations.video")
    public void relayVideoSignal(@Payload VideoSignalMessage message) {
        if (message.roomId() == null || message.roomId().isBlank()) {
            return;
        }
        messagingTemplate.convertAndSend(
            "/topic/consultations/" + message.roomId() + "/video",
            message
        );
    }
}
