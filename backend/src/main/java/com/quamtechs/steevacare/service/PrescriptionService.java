package com.quamtechs.steevacare.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quamtechs.steevacare.dto.request.CreatePrescriptionRequest;
import com.quamtechs.steevacare.dto.response.PrescriptionResponse;
import com.quamtechs.steevacare.entity.Appointment;
import com.quamtechs.steevacare.entity.Consultation;
import com.quamtechs.steevacare.entity.Prescription;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.exception.AppException;
import com.quamtechs.steevacare.repository.AppointmentRepository;
import com.quamtechs.steevacare.repository.ConsultationRepository;
import com.quamtechs.steevacare.repository.PrescriptionRepository;
import com.quamtechs.steevacare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;

    private final PrescriptionRepository prescriptionRepository;
    private final ConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public PrescriptionResponse createForConsultation(Long consultationId, CreatePrescriptionRequest request, Long doctorId) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Consultation introuvable"));
        return create(consultation, request, doctorId);
    }

    @Transactional
    public PrescriptionResponse create(CreatePrescriptionRequest request, Long doctorId) {
        Consultation consultation = resolveConsultation(request);
        return create(consultation, request, doctorId);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getMyPatientPrescriptions(Long patientId) {
        User patient = userRepository.findById(patientId)
            .filter(user -> user.getRole() == Role.PATIENT)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Patient introuvable"));
        return prescriptionRepository.findByPatientWithDetails(patient)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private PrescriptionResponse create(Consultation consultation, CreatePrescriptionRequest request, Long doctorId) {
        Appointment appointment = consultation.getAppointment();
        if (!appointment.getDoctor().getId().equals(doctorId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Vous ne pouvez prescrire que pour vos propres consultations");
        }

        User pharmacy = null;
        if (request.pharmacyId() != null) {
            pharmacy = userRepository.findById(request.pharmacyId())
                .filter(user -> user.getRole() == Role.PHARMACY)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Pharmacie introuvable"));
        }

        Prescription prescription = Prescription.builder()
            .consultation(consultation)
            .medicaments(serializeMedicaments(request.medicaments()))
            .posologie(request.posologie())
            .instructions(request.instructions())
            .dureeJours(request.dureeJours())
            .pharmacy(pharmacy)
            .transmiseAPharmacie(pharmacy != null || Boolean.TRUE.equals(request.transmiseAPharmacie()))
            .codeRetrait(generateUniqueCodeRetrait())
            .build();

        prescription = prescriptionRepository.save(prescription);
        log.info("Ordonnance {} créée pour la consultation {}", prescription.getId(), consultation.getId());
        return toResponse(prescription);
    }

    private Consultation resolveConsultation(CreatePrescriptionRequest request) {
        if (request.consultationId() != null) {
            return consultationRepository.findById(request.consultationId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Consultation introuvable"));
        }
        if (request.appointmentId() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "consultationId ou appointmentId est obligatoire");
        }
        Appointment appointment = appointmentRepository.findById(request.appointmentId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Rendez-vous introuvable"));
        return consultationRepository.findByAppointment(appointment)
            .orElseGet(() -> consultationRepository.save(Consultation.builder().appointment(appointment).build()));
    }

    private String serializeMedicaments(JsonNode medicaments) {
        if (medicaments == null || medicaments.isNull()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "La prescription doit contenir au moins un médicament");
        }
        if (medicaments.isTextual()) {
            return medicaments.asText();
        }
        try {
            return objectMapper.writeValueAsString(medicaments);
        } catch (JsonProcessingException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Format des médicaments invalide");
        }
    }

    private String generateUniqueCodeRetrait() {
        String code;
        do {
            StringBuilder builder = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                builder.append(CODE_ALPHABET.charAt(secureRandom.nextInt(CODE_ALPHABET.length())));
            }
            code = builder.toString();
        } while (prescriptionRepository.existsByCodeRetrait(code));
        return code;
    }

    public PrescriptionResponse toResponse(Prescription p) {
        Appointment appointment = p.getConsultation().getAppointment();
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
            appointment.getPatient().getNom(),
            appointment.getPatient().getPrenom(),
            appointment.getDoctor().getNom() + " " + appointment.getDoctor().getPrenom()
        );
    }
}
