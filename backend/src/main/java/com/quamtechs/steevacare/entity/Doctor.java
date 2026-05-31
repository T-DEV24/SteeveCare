// src/main/java/com/quamtechs/steevacare/entity/Doctor.java
package com.quamtechs.steevacare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String specialite;

    @Column(length = 50)
    private String numeroOrdre;

    @Column(columnDefinition = "TEXT")
    private String biographie;

    @Column(precision = 10, scale = 2)
    private BigDecimal tarif;

    @Column(length = 100)
    private String ville;

    private Integer anneesExperience;
}
