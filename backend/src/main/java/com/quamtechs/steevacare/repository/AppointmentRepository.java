// src/main/java/com/quamtechs/steevacare/repository/AppointmentRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Appointment;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient JOIN FETCH a.doctor " +
           "WHERE a.patient = :patient ORDER BY a.dateHeure DESC")
    List<Appointment> findByPatientOrderByDateHeureDesc(@Param("patient") User patient);

    @Query("SELECT a FROM Appointment a JOIN FETCH a.patient JOIN FETCH a.doctor " +
           "WHERE a.doctor = :doctor ORDER BY a.dateHeure DESC")
    List<Appointment> findByDoctorOrderByDateHeureDesc(@Param("doctor") User doctor);

    List<Appointment> findByDoctorAndStatut(User doctor, AppointmentStatus statut);

    boolean existsByDoctorAndDateHeureBetweenAndStatutNot(
        User doctor,
        LocalDateTime start,
        LocalDateTime end,
        AppointmentStatus statut
    );

    long countByStatut(AppointmentStatus statut);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE DATE(a.dateHeure) = CURRENT_DATE")
    long countToday();
}
