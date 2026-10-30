package org.vadhuvai.vadhuvai_api.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentSlipDTO {
    private String slipNumber;
    private String applicationId;
    private String paymentReference;
    private String sroDistrict;
    private LocalDateTime appointmentAt;
    private boolean synthetic;
}