// src/main/java/com/quamtechs/steevacare/repository/DoctorAvailabilityRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.DoctorAvailability;
import com.quamtechs.steevacare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctor(User doctor);
    List<DoctorAvailability> findByDoctorAndJourSemaine(User doctor, String jourSemaine);
}
