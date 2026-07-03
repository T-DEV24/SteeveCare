// src/main/java/com/quamtechs/steevacare/service/PharmacyService.java
package com.quamtechs.steevacare.service;

import com.quamtechs.steevacare.dto.response.PrescriptionResponse;
import com.quamtechs.steevacare.dto.response.PharmacySummaryResponse;
import com.quamtechs.steevacare.entity.Prescription;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.PrescriptionRepository;
import com.quamtechs.steevacare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PharmacyService {

    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    // ── Lister les ordonnances transmises à la pharmacie ────────────────

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPrescriptionsForPharmacy(Long pharmacyUserId) {
        User pharmacyUser = getPharmacyUserOrThrow(pharmacyUserId);
        return prescriptionRepository.findByPharmacyWithDetails(pharmacyUser)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countPendingPrescriptions(Long pharmacyUserId) {
        User pharmacyUser = getPharmacyUserOrThrow(pharmacyUserId);
        return prescriptionRepository.countByPharmacyAndDelivreeFalse(pharmacyUser);
    }

    @Transactional(readOnly = true)
    public List<PharmacySummaryResponse> getActivePharmacies() {
        return userRepository.findByRoleAndStatusNot(Role.PHARMACY, com.quamtechs.steevacare.enums.AccountStatus.DELETED)
            .stream()
            .filter(user -> user.getStatus() == com.quamtechs.steevacare.enums.AccountStatus.ACTIVE)
            .map(user -> {
                var pharmacy = user.getPharmacy();
                return new PharmacySummaryResponse(
                    user.getId(),
                    pharmacy != null ? pharmacy.getNomPharmacie() : user.getNom(),
                    user.getPrenom(),
                    pharmacy != null ? pharmacy.getVille() : user.getVille(),
                    pharmacy != null ? pharmacy.getAdresse() : null,
                    pharmacy != null && pharmacy.getTelephone() != null ? pharmacy.getTelephone() : user.getTelephone()
                );
            })
            .collect(Collectors.toList());
    }

    // ── Rechercher une ordonnance par code de retrait ────────────────────

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionByCode(String code, Long pharmacyUserId) {
        Prescription prescription = prescriptionRepository.findByCodeRetrait(code)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Aucune ordonnance trouvée avec le code : " + code));

        // Vérifier que cette ordonnance est bien pour cette pharmacie
        if (prescription.getPharmacy() != null &&
            !prescription.getPharmacy().getId().equals(pharmacyUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Cette ordonnance n'est pas destinée à votre pharmacie");
        }

        return toResponse(prescription);
    }

    // ── Marquer une ordonnance comme délivrée ────────────────────────────

    @Transactional
    public PrescriptionResponse markDelivered(Long prescriptionId, Long pharmacyUserId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Ordonnance introuvable avec l'identifiant : " + prescriptionId));

        // Vérifier les droits
        if (prescription.getPharmacy() == null ||
            !prescription.getPharmacy().getId().equals(pharmacyUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Vous n'êtes pas autorisé à délivrer cette ordonnance");
        }

        // Vérifier qu'elle n'est pas déjà délivrée
        if (Boolean.TRUE.equals(prescription.getDelivree())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Cette ordonnance a déjà été délivrée le " +
                prescription.getDateDelivraison());
        }

        prescription.setDelivree(true);
        prescription.setDateDelivraison(LocalDateTime.now());
        prescription = prescriptionRepository.save(prescription);

        log.info("Ordonnance {} délivrée par pharmacie {}", prescriptionId, pharmacyUserId);
        return toResponse(prescription);
    }

    // ── Mapper entité → DTO ──────────────────────────────────────────────

    private PrescriptionResponse toResponse(Prescription p) {
        String patientNom = null;
        String patientPrenom = null;
        String medecinNom = null;

        try {
            var appointment = p.getConsultation().getAppointment();
            patientNom = appointment.getPatient().getNom();
            patientPrenom = appointment.getPatient().getPrenom();
            medecinNom = appointment.getDoctor().getNom() + " " +
                         appointment.getDoctor().getPrenom();
        } catch (Exception ignored) {}

        return new PrescriptionResponse(
            p.getId(),
            p.getMedicaments(),
            p.getPosologie(),
            p.getInstructions(),
            p.getDureeJours(),
            p.getCodeRetrait(),
            p.getDelivree(),
            p.getDateDelivraison(),
            p.getCreatedAt(),
            patientNom,
            patientPrenom,
            medecinNom
        );
    }

    private User getPharmacyUserOrThrow(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Pharmacie introuvable"));
        if (user.getRole() != Role.PHARMACY) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Cet utilisateur n'est pas une pharmacie");
        }
        return user;
    }
}
