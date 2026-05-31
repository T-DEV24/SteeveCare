// src/main/java/com/quamtechs/steevacare/controller/PatientController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.response.UserResponse;
import com.quamtechs.steevacare.entity.MedicalRecord;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.MedicalRecordRepository;
import com.quamtechs.steevacare.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
        @RequestBody Map<String, String> updates
    ) {
        MedicalRecord record = medicalRecordRepository.findByPatient(currentUser)
            .orElseGet(() -> MedicalRecord.builder().patient(currentUser).build());

        if (updates.containsKey("antecedentsFamiliaux")) {
            record.setAntecedentsFamiliaux(updates.get("antecedentsFamiliaux"));
        }
        if (updates.containsKey("traitementEnCours")) {
            record.setTraitementEnCours(updates.get("traitementEnCours"));
        }
        if (updates.containsKey("vaccinations")) {
            record.setVaccinations(updates.get("vaccinations"));
        }

        return ResponseEntity.ok(medicalRecordRepository.save(record));
    }
}
