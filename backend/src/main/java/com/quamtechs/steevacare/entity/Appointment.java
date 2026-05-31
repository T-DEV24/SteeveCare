// src/main/java/com/quamtechs/steevacare/entity/Appointment.java
package com.quamtechs.steevacare.entity;

import com.quamtechs.steevacare.enums.AppointmentStatus;
import com.quamtechs.steevacare.enums.ConsultationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Column(nullable = false)
    private LocalDateTime dateHeure;

    @Builder.Default
    private Integer dureePrevue = 30;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AppointmentStatus statut = AppointmentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConsultationType type;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Column(length = 500)
    private String motifRejet;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
