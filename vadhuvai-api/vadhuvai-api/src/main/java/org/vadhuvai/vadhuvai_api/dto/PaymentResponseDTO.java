package org.vadhuvai.vadhuvai_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {
    private ApplicationResponseDTO application;
    private AppointmentSlipDTO appointmentSlip;
}