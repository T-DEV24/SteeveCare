// src/main/java/com/quamtechs/steevacare/dto/request/CreateUserRequest.java
package com.quamtechs.steevacare.dto.request;

import com.quamtechs.steevacare.enums.Role;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateUserRequest(
    @NotNull(message = "Le rôle est obligatoire")
    Role role,

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    String email,

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    String password,

    @NotBlank(message = "Le nom est obligatoire")
    String nom,

    @NotBlank(message = "Le prénom est obligatoire")
    String prenom,

    String telephone,

    // ── Champs spécifiques DOCTOR ───────────────────
    String specialite,
    String numeroOrdre,
    BigDecimal tarif,
    String villeMedecin,
    Integer anneesExperience,
    String biographie,

    // ── Champs spécifiques PHARMACY ─────────────────
    String nomPharmacie,
    String adressePharmacie,
    String villePharmacie,
    String numeroAutorisation
) {}
