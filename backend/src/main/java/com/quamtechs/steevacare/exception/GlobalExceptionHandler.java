// src/main/java/com/quamtechs/steevacare/exception/GlobalExceptionHandler.java
package com.quamtechs.steevacare.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.hibernate.LazyInitializationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── AppException (erreurs métier) ────────────────────────────────────
    @ExceptionHandler(AppException.class)
    public ResponseEntity<Map<String, Object>> handleAppException(AppException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", ex.getMessage());
        body.put("statut", ex.getStatus().value());
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    // ── Validation des champs (@Valid) ────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
        MethodArgumentNotValidException ex
    ) {
        Map<String, Object> body = new HashMap<>();
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        body.put("erreur", "Données de formulaire invalides");
        body.put("statut", 400);
        body.put("details", errors);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.badRequest().body(body);
    }

    // ── Accès refusé (rôle insuffisant) ──────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
        AccessDeniedException ex
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Accès refusé - vous n'avez pas les droits nécessaires pour cette action");
        body.put("statut", 403);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // ── Utilisateur non trouvé ────────────────────────────────────────────
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameNotFoundException(
        UsernameNotFoundException ex
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Email ou mot de passe incorrect");
        body.put("statut", 401);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }


    // ── Route non trouvée ────────────────────────────────────────────────
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFoundException(
        NoHandlerFoundException ex
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Route non trouvée : " + ex.getHttpMethod() + " " + ex.getRequestURL());
        body.put("statut", 404);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // ── Chargement lazy Hibernate hors session ───────────────────────────
    @ExceptionHandler(LazyInitializationException.class)
    public ResponseEntity<Map<String, Object>> handleLazyInitializationException(
        LazyInitializationException ex
    ) {
        log.error("Erreur de chargement lazy Hibernate : ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Erreur de chargement de données liées — voir logs serveur");
        body.put("statut", 500);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    // ── Erreur générique ──────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Erreur inattendue : ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Erreur interne du serveur - veuillez réessayer plus tard");
        body.put("statut", 500);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
