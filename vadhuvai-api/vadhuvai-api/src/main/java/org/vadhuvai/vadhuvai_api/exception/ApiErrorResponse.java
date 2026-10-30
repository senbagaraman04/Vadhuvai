package org.vadhuvai.vadhuvai_api.exception;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String message,
        List<Map<String, String>> details) {
}