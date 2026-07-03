package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateDoctorProfileRequest(
    @Size(max = 2000, message = "La biographie ne doit pas dépasser 2000 caractères")
    String biographie,

    @DecimalMin(value = "0.0", inclusive = false, message = "Le tarif doit être positif")
    BigDecimal tarif,

    @Min(value = 0, message = "Les années d'expérience ne peuvent pas être négatives")
    @Max(value = 80, message = "Les années d'expérience semblent invalides")
    Integer anneesExperience,

    @Size(max = 100, message = "La ville ne doit pas dépasser 100 caractères")
    String ville
) {}
