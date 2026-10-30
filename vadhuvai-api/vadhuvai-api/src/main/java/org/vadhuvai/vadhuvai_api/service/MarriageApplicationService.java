package org.vadhuvai.vadhuvai_api.service;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.vadhuvai.vadhuvai_api.domain.ApplicationState;
import org.vadhuvai.vadhuvai_api.domain.MarriageApplication;
import org.vadhuvai.vadhuvai_api.dto.ApplicationResponseDTO;
import org.vadhuvai.vadhuvai_api.dto.ApplicationSubmissionDTO;
import org.vadhuvai.vadhuvai_api.dto.AppointmentSlipDTO;
import org.vadhuvai.vadhuvai_api.dto.OcrPreflightResultDTO;
import org.vadhuvai.vadhuvai_api.dto.PaymentResponseDTO;
import org.vadhuvai.vadhuvai_api.exception.ResourceNotFoundException;
import org.vadhuvai.vadhuvai_api.repository.MarriageApplicationRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class MarriageApplicationService {
    private static final long MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
    private static final Set<String> DOCUMENT_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private final MarriageApplicationRepository repository;

    public ApplicationResponseDTO createDraft(ApplicationSubmissionDTO dto) {
        MarriageApplication application = new MarriageApplication();
        BeanUtils.copyProperties(dto, application, "id", "applicationId", "status", "ocrVerified", "createdAt", "updatedAt");
        application.setApplicationId("VAD-" + UUID.randomUUID());
        application.setStatus(ApplicationState.DRAFT);
        application.setOcrVerified(false);
        return toResponse(repository.saveAndFlush(application));
    }

    public OcrPreflightResultDTO verifyOcrDocuments(UUID id, MultipartFile groomId, MultipartFile brideId) {
        MarriageApplication application = findForUpdate(id);
        requireState(application, ApplicationState.DRAFT);
        validateDocument(groomId, "groomId");
        validateDocument(brideId, "brideId");
        application.setOcrVerified(true);
        application.setStatus(ApplicationState.DOCUMENT_VERIFIED);
        repository.saveAndFlush(application);
        return new OcrPreflightResultDTO(true, 1.0, Map.of());
    }

    public PaymentResponseDTO processPayment(UUID id, String paymentReference) {
        if (paymentReference == null || !paymentReference.matches("[A-Za-z0-9][A-Za-z0-9_-]{0,99}")) {
            throw new IllegalArgumentException("A valid payment reference of up to 100 characters is required");
        }
        MarriageApplication application = findForUpdate(id);
        requireState(application, ApplicationState.DOCUMENT_VERIFIED);
        if (!Boolean.TRUE.equals(application.getOcrVerified())) {
            throw new IllegalArgumentException("Documents must be verified before payment");
        }
        application.setStatus(ApplicationState.PAYMENT_PENDING);
        repository.saveAndFlush(application);
        application.setStatus(ApplicationState.SLOT_LOCKED);
        MarriageApplication saved = repository.saveAndFlush(application);
        AppointmentSlipDTO slip = new AppointmentSlipDTO("MOCK-" + id, saved.getApplicationId(),
                paymentReference, saved.getSroDistrict(), LocalDate.now().plusDays(7).atTime(10, 0), true);
        return new PaymentResponseDTO(toResponse(saved), slip);
    }

    @Transactional(readOnly = true)
    public ApplicationResponseDTO getApplicationById(UUID id) {
        return toResponse(repository.findById(id).orElseThrow(() -> notFound(id)));
    }

    private MarriageApplication findForUpdate(UUID id) {
        return repository.findByIdForUpdate(id).orElseThrow(() -> notFound(id));
    }

    private ResourceNotFoundException notFound(UUID id) {
        return new ResourceNotFoundException("Marriage application not found: " + id);
    }

    private void requireState(MarriageApplication application, ApplicationState expected) {
        if (application.getStatus() != expected) {
            throw new IllegalArgumentException("Application must be in " + expected + " state for this operation");
        }
    }

    private void validateDocument(MultipartFile document, String field) {
        if (document == null || document.isEmpty()) {
            throw new IllegalArgumentException(field + " must not be empty");
        }
        if (document.getSize() > MAX_DOCUMENT_SIZE) {
            throw new IllegalArgumentException(field + " must not exceed 5 MB");
        }
        if (document.getContentType() == null || !DOCUMENT_TYPES.contains(document.getContentType())) {
            throw new IllegalArgumentException(field + " must be a JPEG, PNG or PDF document");
        }
    }

    private ApplicationResponseDTO toResponse(MarriageApplication application) {
        ApplicationResponseDTO response = new ApplicationResponseDTO();
        BeanUtils.copyProperties(application, response);
        return response;
    }
}