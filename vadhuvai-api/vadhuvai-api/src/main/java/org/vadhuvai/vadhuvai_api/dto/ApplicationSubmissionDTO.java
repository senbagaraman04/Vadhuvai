package org.vadhuvai.vadhuvai_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ApplicationSubmissionDTO {
    @NotBlank
    @Size(max = 150)
    private String groomName;
    @NotNull
    @Past
    private LocalDate groomDob;
    @NotBlank
    @Pattern(regexp = "[6-9][0-9]{9}", message = "must be a valid 10-digit Indian mobile number")
    private String groomMobile;
    @NotBlank
    @Size(max = 150)
    private String brideName;
    @NotNull
    @Past
    private LocalDate brideDob;
    @NotBlank
    @Pattern(regexp = "[6-9][0-9]{9}", message = "must be a valid 10-digit Indian mobile number")
    private String brideMobile;
    @NotNull
    @PastOrPresent
    private LocalDate marriageDate;
    @NotBlank
    @Size(max = 1000)
    private String venueDetails;
    @NotBlank
    @Size(max = 100)
    private String sroDistrict;
}