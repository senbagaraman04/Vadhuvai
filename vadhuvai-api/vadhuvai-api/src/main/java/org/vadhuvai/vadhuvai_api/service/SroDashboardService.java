package org.vadhuvai.vadhuvai_api.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vadhuvai.vadhuvai_api.domain.ApplicationState;
import org.vadhuvai.vadhuvai_api.domain.MarriageApplication;
import org.vadhuvai.vadhuvai_api.dto.ApplicationResponseDTO;
import org.vadhuvai.vadhuvai_api.dto.SroApprovalRequestDTO;
import org.vadhuvai.vadhuvai_api.dto.SroQueueDTO;
import org.vadhuvai.vadhuvai_api.dto.SroReviewDTO;
import org.vadhuvai.vadhuvai_api.exception.ResourceNotFoundException;
import org.vadhuvai.vadhuvai_api.repository.MarriageApplicationRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SroDashboardService {
    private final MarriageApplicationRepository repository;

    public SroQueueDTO getQueue(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Page must be nonnegative and size must be between 1 and 100");
        }
        var result = repository.findByStatus(ApplicationState.SLOT_LOCKED,
                PageRequest.of(page, size, Sort.by("createdAt").ascending().and(Sort.by("id"))));
        return new SroQueueDTO(result.getContent().stream().map(this::toReview).toList(),
                result.getNumber(), result.getTotalPages(), result.getTotalElements());
    }

    public SroReviewDTO getReview(UUID id) {
        return toReview(repository.findById(id).orElseThrow(() -> notFound(id)));
    }

    @Transactional
    public SroReviewDTO decide(UUID id, SroApprovalRequestDTO request, String officer) {
        MarriageApplication application = repository.findByIdForUpdate(id).orElseThrow(() -> notFound(id));
        if (application.getStatus() != ApplicationState.SLOT_LOCKED) {
            throw new IllegalArgumentException("Only SLOT_LOCKED applications can receive an SRO decision");
        }
        application.setOfficerRemarks(request.officerRemarks().strip());
        application.setDigitalSignatureHash(request.digitalSignatureHash().toLowerCase(java.util.Locale.ROOT));
        application.setReviewedBy(officer);
        application.setReviewedAt(LocalDateTime.now(ZoneOffset.UTC));
        application.setStatus(request.approved() ? ApplicationState.SRO_APPROVED : ApplicationState.SRO_QUERY_RAISED);
        return toReview(repository.saveAndFlush(application));
    }

    private SroReviewDTO toReview(MarriageApplication application) {
        ApplicationResponseDTO response = new ApplicationResponseDTO();
        BeanUtils.copyProperties(application, response);
        List<String> flags = new ArrayList<>();
        flags.add("DOCUMENTS_UNAVAILABLE");
        flags.add("MOCK_OCR_NOT_IDENTITY_VERIFICATION");
        if (!Boolean.TRUE.equals(application.getOcrVerified())) {
            flags.add("OCR_NOT_VERIFIED");
        }
        if (application.getAppointmentSlot() == null) {
            flags.add("APPOINTMENT_SLOT_UNAVAILABLE");
        }
        return new SroReviewDTO(response, List.of(), Map.of(), List.copyOf(flags),
                application.getOfficerRemarks(), application.getReviewedBy(), application.getReviewedAt());
    }

    private ResourceNotFoundException notFound(UUID id) {
        return new ResourceNotFoundException("Marriage application not found: " + id);
    }
}