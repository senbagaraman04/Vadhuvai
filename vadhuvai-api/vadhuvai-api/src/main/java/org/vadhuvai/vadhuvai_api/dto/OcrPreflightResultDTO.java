package org.vadhuvai.vadhuvai_api.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcrPreflightResultDTO {
    private boolean matched;
    private double confidenceScore;
    private Map<String, String> extractedFields;
}