package com.quamtechs.steevacare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    @NotBlank(message = "Le contenu du message est obligatoire")
    @Size(max = 4000, message = "Le message ne doit pas dépasser 4000 caractères")
    String contenu
) {}
