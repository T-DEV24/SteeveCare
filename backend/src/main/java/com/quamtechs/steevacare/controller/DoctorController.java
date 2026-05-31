// src/main/java/com/quamtechs/steevacare/controller/DoctorController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.response.DoctorProfileResponse;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    /**
     * GET /api/doctors/search?specialite=&ville= — Recherche publique de médecins actifs
     */
    @GetMapping("/search")
    public ResponseEntity<List<DoctorProfileResponse>> search(
        @RequestParam(required = false) String specialite,
        @RequestParam(required = false) String ville
    ) {
        return ResponseEntity.ok(doctorService.searchDoctors(specialite, ville));
    }

    /**
     * GET /api/doctors/{id} — Profil public d'un médecin par userId
     */
    @GetMapping("/{id}")
    public ResponseEntity<DoctorProfileResponse> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    /**
     * GET /api/doctors/me — Profil du médecin connecté
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorProfileResponse> getMyProfile(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(doctorService.getMyProfile(currentUser.getId()));
    }

    /**
     * PUT /api/doctors/me — Mise à jour du profil médecin
     */
    @PutMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorProfileResponse> updateMyProfile(
        @AuthenticationPrincipal User currentUser,
        @RequestBody Map<String, Object> updates
    ) {
        return ResponseEntity.ok(doctorService.updateProfile(currentUser.getId(), updates));
    }
}
