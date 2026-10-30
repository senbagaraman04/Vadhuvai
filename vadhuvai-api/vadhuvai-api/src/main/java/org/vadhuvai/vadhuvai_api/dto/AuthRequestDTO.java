package org.vadhuvai.vadhuvai_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AuthRequestDTO {
    @NotBlank
    @Pattern(regexp = "[6-9][0-9]{9}", message = "must be a valid 10-digit Indian mobile number")
    private String mobile;
}