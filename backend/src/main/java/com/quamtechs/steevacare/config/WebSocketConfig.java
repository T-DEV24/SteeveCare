// src/main/java/com/quamtechs/steevacare/config/WebSocketConfig.java
package com.quamtechs.steevacare.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefix pour les messages sortants (vers les clients)
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix pour les messages entrants (vers le serveur)
        config.setApplicationDestinationPrefixes("/app");
        // Prefix pour les messages utilisateur personnels
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("http://localhost:4200", "http://127.0.0.1:4200");

        registry.addEndpoint("/ws-sockjs")
            .setAllowedOriginPatterns("http://localhost:4200", "http://127.0.0.1:4200")
            .withSockJS();
    }
}
