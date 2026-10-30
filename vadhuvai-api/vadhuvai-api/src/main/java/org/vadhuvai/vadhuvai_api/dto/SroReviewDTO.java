package org.vadhuvai.vadhuvai_api.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record SroReviewDTO(
        ApplicationResponseDTO application,
        List<String> documentUrls,
        Map<String, Double> ocrMatchConfidenceScores,
        List<String> flags,
        String officerRemarks,
        String reviewedBy,
        LocalDateTime reviewedAt) {
}