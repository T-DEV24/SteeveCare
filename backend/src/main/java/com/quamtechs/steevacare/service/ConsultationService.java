// src/main/java/com/quamtechs/steevacare/service/ConsultationService.java
package com.quamtechs.steevacare.service;

import com.quamtechs.steevacare.dto.request.CreateConsultationRequest;
import com.quamtechs.steevacare.dto.response.ConsultationResponse;
import com.quamtechs.steevacare.entity.Appointment;
import com.quamtechs.steevacare.entity.Consultation;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AppointmentStatus;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.AppointmentRepository;
import com.quamtechs.steevacare.repository.ConsultationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public ConsultationResponse startConsultation(CreateConsultationRequest request, Long doctorId) {
        Appointment appointment = getAppointmentForDoctor(request.appointmentId(), doctorId);

        if (appointment.getStatut() != AppointmentStatus.CONFIRMED) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Seul un rendez-vous confirmé peut démarrer une consultation");
        }

        Consultation consultation = consultationRepository.findByAppointment(appointment)
            .orElseGet(() -> Consultation.builder()
                .appointment(appointment)
                .debutAt(LocalDateTime.now())
                .build());

        if (consultation.getDebutAt() == null) {
            consultation.setDebutAt(LocalDateTime.now());
        }
        if (request.notesMedecin() != null) {
            consultation.setNotesMedecin(request.notesMedecin());
        }

        consultation = consultationRepository.save(consultation);
        log.info("Consultation {} démarrée pour le RDV {}", consultation.getId(), appointment.getId());
        return toResponse(consultation);
    }

    @Transactional
    public ConsultationResponse saveDoctorNotes(Long consultationId, String notesMedecin, Long doctorId) {
        Consultation consultation = getConsultationForDoctor(consultationId, doctorId);
        if (consultation.getFinAt() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                "Une consultation clôturée ne peut plus être modifiée");
        }
        consultation.setNotesMedecin(notesMedecin);
        return toResponse(consultationRepository.save(consultation));
    }

    @Transactional
    public ConsultationResponse closeConsultation(Long consultationId, String notesMedecin, Long doctorId) {
        Consultation consultation = getConsultationForDoctor(consultationId, doctorId);
        if (consultation.getFinAt() != null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cette consultation est déjà clôturée");
        }
        if (consultation.getDebutAt() == null) {
            consultation.setDebutAt(LocalDateTime.now());
        }
        if (notesMedecin != null) {
            consultation.setNotesMedecin(notesMedecin);
        }

        LocalDateTime finAt = LocalDateTime.now();
        consultation.setFinAt(finAt);
        consultation.setDureeReelle((int) Math.max(1,
            ChronoUnit.MINUTES.between(consultation.getDebutAt(), finAt)));
        consultation.getAppointment().setStatut(AppointmentStatus.COMPLETED);
        appointmentRepository.save(consultation.getAppointment());

        consultation = consultationRepository.save(consultation);
        log.info("Consultation {} clôturée", consultationId);
        return toResponse(consultation);
    }

    @Transactional(readOnly = true)
    public ConsultationResponse getConsultation(Long consultationId, User currentUser) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Consultation introuvable"));
        Appointment appointment = consultation.getAppointment();
        boolean owner = (currentUser.getRole() == Role.DOCTOR && appointment.getDoctor().getId().equals(currentUser.getId()))
            || (currentUser.getRole() == Role.PATIENT && appointment.getPatient().getId().equals(currentUser.getId()))
            || currentUser.getRole() == Role.ADMIN
            || currentUser.getRole() == Role.SUPER_ADMIN;
        if (!owner) {
            throw new AppException(HttpStatus.FORBIDDEN, "Accès interdit à cette consultation");
        }
        return toResponse(consultation);
    }

    private Appointment getAppointmentForDoctor(Long appointmentId, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Rendez-vous introuvable"));
        if (!appointment.getDoctor().getId().equals(doctorId)) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Vous ne pouvez gérer que vos propres consultations");
        }
        return appointment;
    }

    private Consultation getConsultationForDoctor(Long consultationId, Long doctorId) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Consultation introuvable"));
        if (!consultation.getAppointment().getDoctor().getId().equals(doctorId)) {
            throw new AppException(HttpStatus.FORBIDDEN,
                "Vous ne pouvez gérer que vos propres consultations");
        }
        return consultation;
    }

    public ConsultationResponse toResponse(Consultation c) {
        Appointment a = c.getAppointment();
        return new ConsultationResponse(
            c.getId(),
            a.getId(),
            a.getPatient().getId(),
            a.getPatient().getNom(),
            a.getPatient().getPrenom(),
            a.getDoctor().getId(),
            a.getDoctor().getNom(),
            a.getDoctor().getPrenom(),
            a.getDateHeure(),
            a.getStatut(),
            a.getType(),
            a.getMotif(),
            c.getNotesMedecin(),
            c.getDebutAt(),
            c.getFinAt(),
            c.getDureeReelle()
        );
    }
}
