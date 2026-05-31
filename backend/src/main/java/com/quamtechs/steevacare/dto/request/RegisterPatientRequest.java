// src/main/java/com/quamtechs/steevacare/dto/request/RegisterPatientRequest.java
package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.*;

public record RegisterPatientRequest(
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    String email,

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    String password,

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne peut dépasser 100 caractères")
    String nom,

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100, message = "Le prénom ne peut dépasser 100 caractères")
    String prenom,

    @NotBlank(message = "Le téléphone est obligatoire")
    @Pattern(regexp = "^(6[5-9][0-9]{7}|2[0-9]{8}|[0-9]{9})$",
             message = "Numéro de téléphone camerounais invalide")
    String telephone,

    @NotBlank(message = "La ville est obligatoire")
    String ville,

    @NotBlank(message = "Le sexe est obligatoire")
    String sexe
) {}
