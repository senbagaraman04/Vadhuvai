package org.vadhuvai.vadhuvai_api.dto;

import java.util.List;

public record SroQueueDTO(List<SroReviewDTO> content, int page, int totalPages, long totalElements) {
}