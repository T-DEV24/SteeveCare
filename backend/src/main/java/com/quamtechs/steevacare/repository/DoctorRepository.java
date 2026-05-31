// src/main/java/com/quamtechs/steevacare/repository/DoctorRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Doctor;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUser(User user);

    boolean existsByUser(User user);

    @Query("SELECT d FROM Doctor d " +
           "JOIN FETCH d.user u " +
           "WHERE u.status = :status " +
           "AND (:specialite IS NULL OR LOWER(d.specialite) LIKE LOWER(CONCAT('%', :specialite, '%'))) " +
           "AND (:ville IS NULL OR LOWER(d.ville) LIKE LOWER(CONCAT('%', :ville, '%')))")
    List<Doctor> searchActiveDoctors(
        @Param("status") AccountStatus status,
        @Param("specialite") String specialite,
        @Param("ville") String ville
    );
}
