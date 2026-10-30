package org.vadhuvai.vadhuvai_api.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.vadhuvai.vadhuvai_api.domain.ApplicationState;

@Data
@EqualsAndHashCode(callSuper = true)
public class ApplicationResponseDTO extends ApplicationSubmissionDTO {
    private UUID id;
    private String applicationId;
    private ApplicationState status;
    private Boolean ocrVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}