// src/main/java/com/quamtechs/steevacare/controller/AuthController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.LoginRequest;
import com.quamtechs.steevacare.dto.request.RefreshTokenRequest;
import com.quamtechs.steevacare.dto.request.RegisterPatientRequest;
import com.quamtechs.steevacare.dto.response.AuthResponse;
import com.quamtechs.steevacare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register — Inscription d'un nouveau patient (public)
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterPatientRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(authService.registerPatient(request));
    }

    /**
     * POST /api/auth/login — Connexion (public)
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * POST /api/auth/refresh-token — Renouvellement des tokens (public)
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
        @Valid @RequestBody RefreshTokenRequest request
    ) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }
}
