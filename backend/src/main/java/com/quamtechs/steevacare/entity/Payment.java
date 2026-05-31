// src/main/java/com/quamtechs/steevacare/entity/Payment.java
package com.quamtechs.steevacare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(precision = 12, scale = 2)
    private BigDecimal montant;

    // MOMO_MTN, MOMO_ORANGE, CARD, CASH
    @Column(length = 30)
    private String methode;

    // PENDING, COMPLETED, FAILED, REFUNDED
    @Column(length = 20)
    @Builder.Default
    private String statut = "PENDING";

    @Column(length = 100)
    private String referenceMomo;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
