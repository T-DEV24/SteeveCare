// src/main/java/com/quamtechs/steevacare/controller/PatientController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.UpdateMedicalRecordRequest;
import com.quamtechs.steevacare.dto.response.UserResponse;
import com.quamtechs.steevacare.entity.MedicalRecord;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.repository.MedicalRecordRepository;
import com.quamtechs.steevacare.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PATIENT')")
public class PatientController {

    private final AdminService adminService;
    private final MedicalRecordRepository medicalRecordRepository;

    /**
     * GET /api/patients/me — Profil du patient connecté
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminService.toUserResponse(currentUser));
    }

    /**
     * GET /api/patients/me/medical-record — Dossier médical du patient connecté
     */
    @GetMapping("/me/medical-record")
    public ResponseEntity<MedicalRecord> getMyMedicalRecord(
        @AuthenticationPrincipal User currentUser
    ) {
        MedicalRecord record = medicalRecordRepository.findByPatient(currentUser)
            .orElseGet(() -> {
                // Créer un dossier vide si inexistant
                MedicalRecord newRecord = MedicalRecord.builder()
                    .patient(currentUser)
                    .build();
                return medicalRecordRepository.save(newRecord);
            });
        return ResponseEntity.ok(record);
    }

    /**
     * PATCH /api/patients/me/medical-record — Mettre à jour le dossier médical
     */
    @PatchMapping("/me/medical-record")
    public ResponseEntity<MedicalRecord> updateMyMedicalRecord(
        @AuthenticationPrincipal User currentUser,
        @Valid @RequestBody UpdateMedicalRecordRequest request
    ) {
        MedicalRecord record = medicalRecordRepository.findByPatient(currentUser)
            .orElseGet(() -> MedicalRecord.builder().patient(currentUser).build());

        if (request.antecedentsFamiliaux() != null) {
            record.setAntecedentsFamiliaux(request.antecedentsFamiliaux());
        }
        if (request.traitementEnCours() != null) {
            record.setTraitementEnCours(request.traitementEnCours());
        }
        if (request.vaccinations() != null) {
            record.setVaccinations(request.vaccinations());
        }

        return ResponseEntity.ok(medicalRecordRepository.save(record));
    }
}
