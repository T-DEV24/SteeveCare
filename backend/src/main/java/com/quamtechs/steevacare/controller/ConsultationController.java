// src/main/java/com/quamtechs/steevacare/controller/ConsultationController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.CreateConsultationRequest;
import com.quamtechs.steevacare.dto.response.ConsultationResponse;
import com.quamtechs.steevacare.dto.request.UpdateConsultationNotesRequest;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.service.ConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    /**
     * POST /api/consultations/start — Démarrer une consultation depuis un RDV CONFIRMED (DOCTOR uniquement).
     */
    @PostMapping("/start")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationResponse> startConsultation(
        @Valid @RequestBody CreateConsultationRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(consultationService.startConsultation(request, currentUser.getId()));
    }

    /**
     * PATCH /api/consultations/{id}/notes — Enregistrer les notes médecin avant clôture.
     */
    @PatchMapping("/{id}/notes")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationResponse> saveDoctorNotes(
        @PathVariable Long id,
        @Valid @RequestBody UpdateConsultationNotesRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            consultationService.saveDoctorNotes(id, request.notesMedecin(), currentUser.getId())
        );
    }

    /**
     * PATCH /api/consultations/{id}/close — Clôturer la consultation et compléter le RDV associé.
     */
    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationResponse> closeConsultation(
        @PathVariable Long id,
        @Valid @RequestBody UpdateConsultationNotesRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            consultationService.closeConsultation(id, request.notesMedecin(), currentUser.getId())
        );
    }

    /**
     * GET /api/consultations/{id} — Détail d'une consultation pour le médecin, patient ou admin autorisé.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ConsultationResponse> getConsultation(
        @PathVariable Long id,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(consultationService.getConsultation(id, currentUser));
    }
}
