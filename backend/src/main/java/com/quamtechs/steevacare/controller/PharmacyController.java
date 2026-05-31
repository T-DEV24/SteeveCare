// src/main/java/com/quamtechs/steevacare/controller/PharmacyController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.response.PrescriptionResponse;
import com.quamtechs.steevacare.dto.response.UserResponse;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.service.AdminService;
import com.quamtechs.steevacare.service.PharmacyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PHARMACY')")
public class PharmacyController {

    private final PharmacyService pharmacyService;
    private final AdminService adminService;

    /**
     * GET /api/pharmacy/me — Profil de la pharmacie connectée
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminService.toUserResponse(currentUser));
    }

    /**
     * GET /api/pharmacy/prescriptions — Ordonnances transmises à cette pharmacie
     */
    @GetMapping("/prescriptions")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptions(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            pharmacyService.getPrescriptionsForPharmacy(currentUser.getId())
        );
    }

    /**
     * GET /api/pharmacy/prescriptions/retrait/{code} — Rechercher par code de retrait
     */
    @GetMapping("/prescriptions/retrait/{code}")
    public ResponseEntity<PrescriptionResponse> getPrescriptionByCode(
        @PathVariable String code,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            pharmacyService.getPrescriptionByCode(code, currentUser.getId())
        );
    }

    /**
     * PATCH /api/pharmacy/prescriptions/{id}/delivered — Marquer comme délivrée
     */
    @PatchMapping("/prescriptions/{id}/delivered")
    public ResponseEntity<PrescriptionResponse> markDelivered(
        @PathVariable Long id,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
            pharmacyService.markDelivered(id, currentUser.getId())
        );
    }
}
