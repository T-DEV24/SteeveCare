// src/main/java/com/quamtechs/steevacare/entity/Pharmacy.java
package com.quamtechs.steevacare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pharmacies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pharmacy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 150)
    private String nomPharmacie;

    @Column(length = 255)
    private String adresse;

    @Column(length = 100)
    private String ville;

    @Column(length = 20)
    private String telephone;

    @Column(length = 50)
    private String numeroAutorisation;
}
