// src/main/java/com/quamtechs/steevacare/repository/PatientRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Patient;
import com.quamtechs.steevacare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUser(User user);
    boolean existsByUser(User user);
}
