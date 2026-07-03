// src/main/java/com/quamtechs/steevacare/config/DataInitializer.java
package com.quamtechs.steevacare.config;

import com.quamtechs.steevacare.entity.Doctor;
import com.quamtechs.steevacare.entity.Patient;
import com.quamtechs.steevacare.entity.Pharmacy;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;
import com.quamtechs.steevacare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@Profile("!prod")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PharmacyRepository pharmacyRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initData() {
        log.info("=== Initialisation des données SteevaCare ===");

        createSuperAdmin();
        createAdmin();
        createGestionnaire();
        createDoctor1();
        createDoctor2();
        createDoctor3();
        createPharmacy1();
        createPharmacy2();
        createPatient();

        log.info("=== Initialisation terminée ===");
    }

    private void createSuperAdmin() {
        if (!userRepository.existsByEmail("superadmin@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("superadmin@steevacare.cm")
                .password(passwordEncoder.encode("Admin@12345"))
                .role(Role.SUPER_ADMIN)
                .status(AccountStatus.ACTIVE)
                .nom("Administrateur")
                .prenom("Super")
                .telephone("677000001")
                .build());
            log.info("✅ SUPER_ADMIN créé : {}", u.getEmail());
        }
    }

    private void createAdmin() {
        if (!userRepository.existsByEmail("admin@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("admin@steevacare.cm")
                .password(passwordEncoder.encode("Admin@12345"))
                .role(Role.ADMIN)
                .status(AccountStatus.ACTIVE)
                .nom("Admin")
                .prenom("Principal")
                .telephone("677000002")
                .build());
            log.info("✅ ADMIN créé : {}", u.getEmail());
        }
    }

    private void createGestionnaire() {
        if (!userRepository.existsByEmail("gestionnaire@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("gestionnaire@steevacare.cm")
                .password(passwordEncoder.encode("Admin@12345"))
                .role(Role.GESTIONNAIRE)
                .status(AccountStatus.ACTIVE)
                .nom("Gestionnaire")
                .prenom("Régional")
                .telephone("677000003")
                .build());
            log.info("✅ GESTIONNAIRE créé : {}", u.getEmail());
        }
    }

    private void createDoctor1() {
        if (!userRepository.existsByEmail("dr.martin@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("dr.martin@steevacare.cm")
                .password(passwordEncoder.encode("Doctor@12345"))
                .role(Role.DOCTOR)
                .status(AccountStatus.ACTIVE)
                .nom("Martin")
                .prenom("Jean-Pierre")
                .telephone("677100001")
                .build());
            doctorRepository.save(Doctor.builder()
                .user(u)
                .specialite("Cardiologue")
                .numeroOrdre("CM-CARD-0042")
                .tarif(new BigDecimal("15000"))
                .ville("Yaoundé")
                .anneesExperience(8)
                .biographie("Cardiologue expérimenté, diplômé de la Faculté de Médecine de " +
                    "Yaoundé. Spécialisé dans le traitement des maladies cardiovasculaires " +
                    "et l'hypertension artérielle. Membre de la Société Camerounaise de Cardiologie.")
                .build());
            log.info("✅ DOCTOR 1 créé : {}", u.getEmail());
        }
    }

    private void createDoctor2() {
        if (!userRepository.existsByEmail("dr.ngo@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("dr.ngo@steevacare.cm")
                .password(passwordEncoder.encode("Doctor@12345"))
                .role(Role.DOCTOR)
                .status(AccountStatus.ACTIVE)
                .nom("Ngo Biyong")
                .prenom("Marie-Claire")
                .telephone("677100002")
                .build());
            doctorRepository.save(Doctor.builder()
                .user(u)
                .specialite("Pédiatre")
                .numeroOrdre("CM-PED-0117")
                .tarif(new BigDecimal("10000"))
                .ville("Douala")
                .anneesExperience(5)
                .biographie("Pédiatre passionnée par la santé de l'enfant. Diplômée de l'Université " +
                    "de Douala, avec une formation complémentaire en néonatologie. " +
                    "Consultation en français et en anglais.")
                .build());
            log.info("✅ DOCTOR 2 créé : {}", u.getEmail());
        }
    }

    private void createDoctor3() {
        if (!userRepository.existsByEmail("dr.mbarga@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("dr.mbarga@steevacare.cm")
                .password(passwordEncoder.encode("Doctor@12345"))
                .role(Role.DOCTOR)
                .status(AccountStatus.ACTIVE)
                .nom("Mbarga")
                .prenom("Paul")
                .telephone("677100003")
                .build());
            doctorRepository.save(Doctor.builder()
                .user(u)
                .specialite("Généraliste")
                .numeroOrdre("CM-GEN-0289")
                .tarif(new BigDecimal("7500"))
                .ville("Yaoundé")
                .anneesExperience(12)
                .biographie("Médecin généraliste avec 12 ans d'expérience dans la médecine " +
                    "de ville à Yaoundé. Prise en charge globale du patient adulte et enfant. " +
                    "Disponible en téléconsultation.")
                .build());
            log.info("✅ DOCTOR 3 créé : {}", u.getEmail());
        }
    }

    private void createPharmacy1() {
        if (!userRepository.existsByEmail("pharma.centrale@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("pharma.centrale@steevacare.cm")
                .password(passwordEncoder.encode("Pharma@12345"))
                .role(Role.PHARMACY)
                .status(AccountStatus.ACTIVE)
                .nom("Pharmacie Centrale")
                .prenom("Yaoundé")
                .telephone("222231456")
                .build());
            pharmacyRepository.save(Pharmacy.builder()
                .user(u)
                .nomPharmacie("Pharmacie Centrale")
                .adresse("Avenue Kennedy, Centre-ville")
                .ville("Yaoundé")
                .telephone("222231456")
                .numeroAutorisation("MINSANTE-YDE-0045")
                .build());
            log.info("✅ PHARMACY 1 créée : {}", u.getEmail());
        }
    }

    private void createPharmacy2() {
        if (!userRepository.existsByEmail("pharma.akwa@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("pharma.akwa@steevacare.cm")
                .password(passwordEncoder.encode("Pharma@12345"))
                .role(Role.PHARMACY)
                .status(AccountStatus.ACTIVE)
                .nom("Pharmacie Akwa")
                .prenom("Douala")
                .telephone("233421234")
                .build());
            pharmacyRepository.save(Pharmacy.builder()
                .user(u)
                .nomPharmacie("Pharmacie Akwa")
                .adresse("Rue Joss, Akwa")
                .ville("Douala")
                .telephone("233421234")
                .numeroAutorisation("MINSANTE-DLA-0112")
                .build());
            log.info("✅ PHARMACY 2 créée : {}", u.getEmail());
        }
    }

    private void createPatient() {
        if (!userRepository.existsByEmail("patient@steevacare.cm")) {
            User u = userRepository.save(User.builder()
                .email("patient@steevacare.cm")
                .password(passwordEncoder.encode("Patient@12345"))
                .role(Role.PATIENT)
                .status(AccountStatus.ACTIVE)
                .nom("Dupont")
                .prenom("Jean")
                .telephone("677200001")
                .build());
            patientRepository.save(Patient.builder()
                .user(u)
                .ville("Yaoundé")
                .sexe("Masculin")
                .groupeSanguin("A+")
                .build());
            log.info("✅ PATIENT créé : {}", u.getEmail());
        }
    }
}
