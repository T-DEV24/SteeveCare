// src/main/java/com/quamtechs/steevacare/entity/MedicalRecord.java
package com.quamtechs.steevacare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, unique = true)
    private User patient;

    @Column(columnDefinition = "TEXT")
    private String antecedentsFamiliaux;

    @Column(columnDefinition = "TEXT")
    private String traitementEnCours;

    @Column(columnDefinition = "TEXT")
    private String vaccinations;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
