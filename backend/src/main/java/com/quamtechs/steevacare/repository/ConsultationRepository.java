// src/main/java/com/quamtechs/steevacare/repository/ConsultationRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Appointment;
import com.quamtechs.steevacare.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    Optional<Consultation> findByAppointment(Appointment appointment);
}
