// src/main/java/com/quamtechs/steevacare/service/DoctorService.java
package com.quamtechs.steevacare.service;

import com.quamtechs.steevacare.dto.request.UpdateDoctorProfileRequest;
import com.quamtechs.steevacare.dto.response.DoctorProfileResponse;
import com.quamtechs.steevacare.entity.Doctor;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.DoctorRepository;
import com.quamtechs.steevacare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    // ── Rechercher des médecins actifs ───────────────────────────────────

    @Transactional(readOnly = true)
    public List<DoctorProfileResponse> searchDoctors(String specialite, String ville) {
        String spec = (specialite == null || specialite.isBlank()) ? null : specialite;
        String v    = (ville == null || ville.isBlank()) ? null : ville;

        return doctorRepository.searchActiveDoctors(AccountStatus.ACTIVE, spec, v)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    // ── Profil médecin par ID utilisateur ───────────────────────────────

    @Transactional(readOnly = true)
    public DoctorProfileResponse getDoctorById(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Médecin introuvable avec l'identifiant : " + userId));

        Doctor doctor = doctorRepository.findByUser(user)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Profil médecin introuvable"));

        return toResponse(doctor);
    }

    // ── Profil du médecin connecté ───────────────────────────────────────

    @Transactional(readOnly = true)
    public DoctorProfileResponse getMyProfile(Long userId) {
        return getDoctorById(userId);
    }

    // ── Mettre à jour le profil médecin ─────────────────────────────────

    @Transactional
    public DoctorProfileResponse updateProfile(Long userId, UpdateDoctorProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Médecin introuvable"));

        Doctor doctor = doctorRepository.findByUser(user)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Profil médecin introuvable"));

        if (request.biographie() != null) {
            doctor.setBiographie(request.biographie());
        }
        if (request.tarif() != null) {
            doctor.setTarif(request.tarif());
        }
        if (request.anneesExperience() != null) {
            doctor.setAnneesExperience(request.anneesExperience());
        }
        if (request.ville() != null) {
            doctor.setVille(request.ville());
        }

        return toResponse(doctorRepository.save(doctor));
    }

    // ── Mapper entité → DTO ──────────────────────────────────────────────

    public DoctorProfileResponse toResponse(Doctor d) {
        return new DoctorProfileResponse(
            d.getId(),
            d.getUser().getId(),
            d.getUser().getNom(),
            d.getUser().getPrenom(),
            d.getUser().getPhotoUrl(),
            d.getSpecialite(),
            d.getNumeroOrdre(),
            d.getBiographie(),
            d.getTarif(),
            d.getVille(),
            d.getAnneesExperience(),
            d.getUser().getStatus()
        );
    }
}
