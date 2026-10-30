package org.vadhuvai.vadhuvai_api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SroApprovalRequestDTO(
        @NotBlank @Size(max = 2000) String officerRemarks,
        @NotBlank @Pattern(regexp = "[a-fA-F0-9]{64}", message = "must be a 64-character SHA-256 hexadecimal hash")
        String digitalSignatureHash,
        @JsonProperty(required = true) @JsonSetter(nulls = Nulls.FAIL) boolean approved) {
}