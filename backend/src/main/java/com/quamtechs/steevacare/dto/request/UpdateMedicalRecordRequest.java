package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateMedicalRecordRequest(
    @Size(max = 4000, message = "Les antécédents familiaux ne doivent pas dépasser 4000 caractères")
    String antecedentsFamiliaux,

    @Size(max = 4000, message = "Le traitement en cours ne doit pas dépasser 4000 caractères")
    String traitementEnCours,

    @Size(max = 4000, message = "Les vaccinations ne doivent pas dépasser 4000 caractères")
    String vaccinations
) {}
