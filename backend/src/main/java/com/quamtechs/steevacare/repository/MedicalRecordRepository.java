// src/main/java/com/quamtechs/steevacare/repository/MedicalRecordRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.MedicalRecord;
import com.quamtechs.steevacare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    Optional<MedicalRecord> findByPatient(User patient);
}
