// src/main/java/com/quamtechs/steevacare/repository/PaymentRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Appointment;
import com.quamtechs.steevacare.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByAppointment(Appointment appointment);
}
