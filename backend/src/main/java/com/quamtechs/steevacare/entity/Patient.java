// src/main/java/com/quamtechs/steevacare/entity/Patient.java
package com.quamtechs.steevacare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private LocalDate dateNaissance;

    @Column(length = 20)
    private String sexe;

    @Column(length = 100)
    private String ville;

    @Column(length = 255)
    private String adresse;

    @Column(columnDefinition = "TEXT")
    private String antecedents;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(length = 10)
    private String groupeSanguin;
}
