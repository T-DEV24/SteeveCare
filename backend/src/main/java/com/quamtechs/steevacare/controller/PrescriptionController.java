package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.CreatePrescriptionRequest;
import com.quamtechs.steevacare.dto.response.PrescriptionResponse;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * POST /api/consultations/{id}/prescriptions — Crée une ordonnance pour une consultation du médecin connecté.
     */
    @PostMapping("/api/consultations/{id}/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> createForConsultation(
        @PathVariable Long id,
        @Valid @RequestBody CreatePrescriptionRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(prescriptionService.createForConsultation(id, request, currentUser.getId()));
    }

    /**
     * POST /api/prescriptions — Compatibilité avec l'écran d'envoi direct qui fournit appointmentId.
     */
    @PostMapping("/api/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> create(
        @Valid @RequestBody CreatePrescriptionRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(prescriptionService.create(request, currentUser.getId()));
    }

    /**
     * GET /api/prescriptions/patient/me — Liste les ordonnances du patient connecté.
     */
    @GetMapping("/api/prescriptions/patient/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<PrescriptionResponse>> getMyPrescriptions(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(prescriptionService.getMyPatientPrescriptions(currentUser.getId()));
    }
}
