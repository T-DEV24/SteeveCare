// src/main/java/com/quamtechs/steevacare/controller/MessageController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.SendMessageRequest;
import com.quamtechs.steevacare.dto.request.WebSocketChatMessageRequest;
import com.quamtechs.steevacare.dto.response.MessageResponse;
import com.quamtechs.steevacare.entity.Message;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.MessageRepository;
import com.quamtechs.steevacare.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * GET /api/messages/{otherUserId} — Historique d'une conversation
     */
    @GetMapping("/{otherUserId}")
    public ResponseEntity<List<MessageResponse>> getConversation(
        @PathVariable Long otherUserId,
        @AuthenticationPrincipal User currentUser
    ) {
        User other = userRepository.findById(otherUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Utilisateur introuvable"));

        List<MessageResponse> messages = messageRepository
            .findConversation(currentUser, other)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());

        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/messages/{receiverId} — Envoyer un message
     */
    @PostMapping("/{receiverId}")
    public ResponseEntity<MessageResponse> sendMessage(
        @PathVariable Long receiverId,
        @Valid @RequestBody SendMessageRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        User receiver = userRepository.findById(receiverId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Destinataire introuvable"));

        Message message = Message.builder()
            .sender(currentUser)
            .receiver(receiver)
            .contenu(request.contenu())
            .isRead(false)
            .build();

        message = messageRepository.save(message);
        MessageResponse response = toResponse(message);

        // Notifier le destinataire via WebSocket
        messagingTemplate.convertAndSendToUser(
            receiver.getEmail(),
            "/queue/messages",
            response
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PATCH /api/messages/{otherUserId}/read — Marquer les messages comme lus
     */
    @PatchMapping("/{otherUserId}/read")
    public ResponseEntity<Void> markAsRead(
        @PathVariable Long otherUserId,
        @AuthenticationPrincipal User currentUser
    ) {
        User other = userRepository.findById(otherUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Utilisateur introuvable"));

        List<Message> unread = messageRepository.findConversation(currentUser, other)
            .stream()
            .filter(m -> m.getReceiver().getId().equals(currentUser.getId())
                      && !m.getIsRead())
            .collect(Collectors.toList());

        unread.forEach(m -> m.setIsRead(true));
        messageRepository.saveAll(unread);

        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/messages/unread-count — Nombre de messages non lus
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            messageRepository.countByReceiverAndIsReadFalse(currentUser)
        );
    }

    /**
     * WebSocket — Réception et diffusion d'un message temps réel
     */
    @MessageMapping("/chat.send")
    public void handleWebSocketMessage(@Valid @Payload WebSocketChatMessageRequest payload) {
        // Le message est déjà envoyé via REST, WebSocket pour la diffusion temps réel
        userRepository.findById(payload.receiverId()).ifPresent(receiver ->
            messagingTemplate.convertAndSendToUser(
                receiver.getEmail(),
                "/queue/messages",
                payload
            )
        );
    }

    // ── Mapper ───────────────────────────────────────────────────────────
    private MessageResponse toResponse(Message m) {
        return new MessageResponse(
            m.getId(),
            m.getSender().getId(),
            m.getSender().getNom(),
            m.getSender().getPrenom(),
            m.getReceiver().getId(),
            m.getContenu(),
            m.getTimestamp(),
            m.getIsRead(),
            m.getAppointment() != null ? m.getAppointment().getId() : null
        );
    }
}
