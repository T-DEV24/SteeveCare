// src/main/java/com/quamtechs/steevacare/entity/Prescription.java
package com.quamtechs.steevacare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id", nullable = false)
    private Consultation consultation;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String medicaments;

    @Column(columnDefinition = "TEXT")
    private String posologie;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    private Integer dureeJours;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacy_id")
    private User pharmacy;

    @Column(unique = true, length = 30)
    private String codeRetrait;

    @Builder.Default
    private Boolean transmiseAPharmacie = false;

    @Builder.Default
    private Boolean delivree = false;

    private LocalDateTime dateDelivraison;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
