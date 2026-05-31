// src/main/java/com/quamtechs/steevacare/entity/Consultation.java
package com.quamtechs.steevacare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(columnDefinition = "TEXT")
    private String notesMedecin;

    private LocalDateTime debutAt;

    private LocalDateTime finAt;

    private Integer dureeReelle;
}
