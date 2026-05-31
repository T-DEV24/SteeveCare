// src/main/java/com/quamtechs/steevacare/repository/PrescriptionRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Prescription;
import com.quamtechs.steevacare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByCodeRetrait(String codeRetrait);

    List<Prescription> findByPharmacy(User pharmacy);

    List<Prescription> findByPharmacyAndTransmiseAPharmacie(User pharmacy, Boolean transmise);

    @Query("SELECT p FROM Prescription p " +
           "JOIN FETCH p.consultation c " +
           "JOIN FETCH c.appointment a " +
           "WHERE p.pharmacy = :pharmacy " +
           "ORDER BY p.createdAt DESC")
    List<Prescription> findByPharmacyWithDetails(@Param("pharmacy") User pharmacy);
}
