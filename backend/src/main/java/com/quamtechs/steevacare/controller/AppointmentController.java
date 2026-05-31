// src/main/java/com/quamtechs/steevacare/controller/AppointmentController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.CreateAppointmentRequest;
import com.quamtechs.steevacare.dto.request.UpdateAppointmentStatusRequest;
import com.quamtechs.steevacare.dto.response.AppointmentResponse;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * POST /api/appointments — Créer un rendez-vous (PATIENT uniquement)
     */
    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponse> createAppointment(
        @Valid @RequestBody CreateAppointmentRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(appointmentService.createAppointment(request, currentUser.getId()));
    }

    /**
     * GET /api/appointments/patient/me — RDV du patient connecté
     */
    @GetMapping("/patient/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointmentsAsPatient(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            appointmentService.getPatientAppointments(currentUser.getId())
        );
    }

    /**
     * GET /api/appointments/doctor/me — RDV du médecin connecté
     */
    @GetMapping("/doctor/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointmentsAsDoctor(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            appointmentService.getDoctorAppointments(currentUser.getId())
        );
    }

    /**
     * PATCH /api/appointments/{id}/status — Mettre à jour le statut d'un RDV
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    public ResponseEntity<AppointmentResponse> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdateAppointmentStatusRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            appointmentService.updateStatus(id, request, currentUser.getId())
        );
    }

    /**
     * GET /api/appointments/{id} — Détail d'un rendez-vous (DOCTOR ou PATIENT)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AppointmentResponse> getAppointmentById(
        @PathVariable Long id,
        @AuthenticationPrincipal User currentUser
    ) {
        // Récupérer via la liste du rôle approprié
        if (currentUser.getRole().name().equals("DOCTOR")) {
            return ResponseEntity.ok(
                appointmentService.getDoctorAppointments(currentUser.getId())
                    .stream()
                    .filter(a -> a.id().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new com.quamtechs.steevacare.exception.AppException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "Rendez-vous introuvable"
                    ))
            );
        }
        return ResponseEntity.ok(
            appointmentService.getPatientAppointments(currentUser.getId())
                .stream()
                .filter(a -> a.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new com.quamtechs.steevacare.exception.AppException(
                    org.springframework.http.HttpStatus.NOT_FOUND,
                    "Rendez-vous introuvable"
                ))
        );
    }
}
