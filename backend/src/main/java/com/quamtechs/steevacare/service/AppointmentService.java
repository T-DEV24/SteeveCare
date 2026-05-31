// src/main/java/com/quamtechs/steevacare/service/AppointmentService.java
package com.quamtechs.steevacare.service;

import com.quamtechs.steevacare.dto.request.CreateAppointmentRequest;
import com.quamtechs.steevacare.dto.request.UpdateAppointmentStatusRequest;
import com.quamtechs.steevacare.dto.response.AppointmentResponse;
import com.quamtechs.steevacare.entity.Appointment;
import com.quamtechs.steevacare.entity.Doctor;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.AppointmentStatus;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.AppointmentRepository;
import com.quamtechs.steevacare.repository.DoctorRepository;
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
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;

    // ── Créer un rendez-vous ─────────────────────────────────────────────

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest req, Long patientId) {
        // 1. Récupérer patient et médecin
        User patient = userRepository.findById(patientId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Patient introuvable"));

        User doctor = userRepository.findById(req.doctorId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Médecin introuvable avec l'identifiant : " + req.doctorId()));

        // 2. Vérifier que c'est bien un médecin
        if (doctor.getRole() != Role.DOCTOR) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "L'utilisateur sélectionné n'est pas un médecin");
        }

        // 3. Vérifier que le médecin est actif
        if (doctor.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Ce médecin n'est pas disponible pour les consultations");
        }

        // 4. Vérifier que la date est dans le futur (au moins 30 min)
        if (req.dateHeure().isBefore(LocalDateTime.now().plusMinutes(30))) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Le rendez-vous doit être planifié au moins 30 minutes à l'avance");
        }

        // 5. Vérifier les conflits horaires (plage de 30 min)
        LocalDateTime endTime = req.dateHeure().plusMinutes(30);
        boolean hasConflict = appointmentRepository
            .existsByDoctorAndDateHeureBetweenAndStatutNot(
                doctor,
                req.dateHeure().minusMinutes(29),
                endTime,
                AppointmentStatus.CANCELLED
            );

        if (hasConflict) {
            throw new AppException(HttpStatus.CONFLICT,
                "Ce médecin a déjà un rendez-vous à cette heure. " +
                "Veuillez choisir un autre créneau horaire.");
        }

        // 6. Créer le rendez-vous
        Appointment appointment = Appointment.builder()
            .patient(patient)
            .doctor(doctor)
            .dateHeure(req.dateHeure())
            .type(req.type())
            .motif(req.motif())
            .statut(AppointmentStatus.PENDING)
            .dureePrevue(30)
            .build();

        appointment = appointmentRepository.save(appointment);
        log.info("RDV créé entre patient {} et médecin {}", patientId, req.doctorId());

        return toResponse(appointment);
    }

    // ── Mettre à jour le statut ──────────────────────────────────────────

    @Transactional
    public AppointmentResponse updateStatus(
        Long appointmentId,
        UpdateAppointmentStatusRequest req,
        Long userId
    ) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                "Rendez-vous introuvable avec l'identifiant : " + appointmentId));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        AppointmentStatus currentStatus = appointment.getStatut();
        AppointmentStatus newStatus = req.status();

        // Valider les transitions selon le rôle
        if (user.getRole() == Role.DOCTOR) {
            // Le médecin ne peut agir que sur ses propres RDV
            if (!appointment.getDoctor().getId().equals(userId)) {
                throw new AppException(HttpStatus.FORBIDDEN,
                    "Vous ne pouvez modifier que vos propres rendez-vous");
            }
            // Transitions autorisées pour le médecin
            if (currentStatus == AppointmentStatus.PENDING &&
                (newStatus == AppointmentStatus.CONFIRMED || newStatus == AppointmentStatus.REJECTED)) {
                // OK
            } else if (currentStatus == AppointmentStatus.CONFIRMED &&
                       newStatus == AppointmentStatus.COMPLETED) {
                // OK
            } else {
                throw new AppException(HttpStatus.BAD_REQUEST,
                    "Transition de statut non autorisée : " + currentStatus + " → " + newStatus);
            }
        } else if (user.getRole() == Role.PATIENT) {
            // Le patient ne peut annuler que ses propres RDV PENDING
            if (!appointment.getPatient().getId().equals(userId)) {
                throw new AppException(HttpStatus.FORBIDDEN,
                    "Vous ne pouvez modifier que vos propres rendez-vous");
            }
            if (newStatus != AppointmentStatus.CANCELLED) {
                throw new AppException(HttpStatus.FORBIDDEN,
                    "Un patient ne peut qu'annuler un rendez-vous");
            }
            if (currentStatus != AppointmentStatus.PENDING &&
                currentStatus != AppointmentStatus.CONFIRMED) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                    "Ce rendez-vous ne peut plus être annulé (statut : " + currentStatus + ")");
            }
        }

        // Motif de rejet obligatoire si REJECTED
        if (newStatus == AppointmentStatus.REJECTED) {
            if (req.motifRejet() == null || req.motifRejet().isBlank()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                    "Le motif de refus est obligatoire");
            }
            appointment.setMotifRejet(req.motifRejet());
        }

        appointment.setStatut(newStatus);
        appointment = appointmentRepository.save(appointment);

        log.info("RDV {} : {} → {}", appointmentId, currentStatus, newStatus);
        return toResponse(appointment);
    }

    // ── Récupérer les RDV du patient ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(Long patientId) {
        User patient = userRepository.findById(patientId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Patient introuvable"));

        return appointmentRepository.findByPatientOrderByDateHeureDesc(patient)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    // ── Récupérer les RDV du médecin ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorAppointments(Long doctorId) {
        User doctor = userRepository.findById(doctorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Médecin introuvable"));

        return appointmentRepository.findByDoctorOrderByDateHeureDesc(doctor)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    // ── Mapper entité → DTO ─────────────────────────────────────────────

    public AppointmentResponse toResponse(Appointment a) {
        // Récupérer le profil médecin pour la spécialité et le tarif
        Doctor doctorProfile = null;
        try {
            doctorProfile = doctorRepository.findByUser(a.getDoctor()).orElse(null);
        } catch (Exception ignored) {}

        return new AppointmentResponse(
            a.getId(),
            a.getPatient().getId(),
            a.getPatient().getNom(),
            a.getPatient().getPrenom(),
            a.getDoctor().getId(),
            a.getDoctor().getNom(),
            a.getDoctor().getPrenom(),
            doctorProfile != null ? doctorProfile.getSpecialite() : null,
            doctorProfile != null ? doctorProfile.getTarif() : null,
            a.getDateHeure(),
            a.getDureePrevue(),
            a.getStatut(),
            a.getType(),
            a.getMotif(),
            a.getMotifRejet(),
            a.getCreatedAt()
        );
    }
}
