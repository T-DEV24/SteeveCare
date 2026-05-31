// src/main/java/com/quamtechs/steevacare/repository/PharmacyRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Pharmacy;
import com.quamtechs.steevacare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {
    Optional<Pharmacy> findByUser(User user);
    boolean existsByUser(User user);
    List<Pharmacy> findAll();
}
