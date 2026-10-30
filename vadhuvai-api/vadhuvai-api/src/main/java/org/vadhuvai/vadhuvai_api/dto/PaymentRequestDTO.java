package org.vadhuvai.vadhuvai_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentRequestDTO {
    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "[A-Za-z0-9][A-Za-z0-9_-]*", message = "must contain only letters, digits, hyphens or underscores")
    private String paymentReference;
}