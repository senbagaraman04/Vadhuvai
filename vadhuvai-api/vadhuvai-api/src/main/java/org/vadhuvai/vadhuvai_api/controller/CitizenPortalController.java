package org.vadhuvai.vadhuvai_api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.vadhuvai.vadhuvai_api.dto.ApplicationResponseDTO;
import org.vadhuvai.vadhuvai_api.dto.ApplicationSubmissionDTO;
import org.vadhuvai.vadhuvai_api.dto.AuthRequestDTO;
import org.vadhuvai.vadhuvai_api.dto.AuthResponseDTO;
import org.vadhuvai.vadhuvai_api.dto.OcrPreflightResultDTO;
import org.vadhuvai.vadhuvai_api.dto.PaymentRequestDTO;
import org.vadhuvai.vadhuvai_api.dto.PaymentResponseDTO;
import org.vadhuvai.vadhuvai_api.service.MarriageApplicationService;

@RestController
@RequestMapping("/api/v1/citizen")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4201"})
@RequiredArgsConstructor
@Tag(name = "Citizen Portal")
public class CitizenPortalController {
    private final MarriageApplicationService service;

    @GetMapping("/auth/csrf")
    @Operation(summary = "Retrieve the CSRF token for session-bound POST requests")
    public ResponseEntity<CsrfToken> csrf(CsrfToken token) {
        return ResponseEntity.ok(token);
    }

    @PostMapping("/auth/otp")
    @SecurityRequirements
    @Operation(summary = "Create a mock OTP challenge", description = "No SMS is sent. The token is not an authentication credential.")
    public ResponseEntity<AuthResponseDTO> requestOtp(@Valid @RequestBody AuthRequestDTO request) {
        String mobile = request.getMobile();
        return ResponseEntity.ok(new AuthResponseDTO("mock-" + UUID.randomUUID(),
                "******" + mobile.substring(mobile.length() - 4)));
    }

    @PostMapping("/application")
    @ApiResponse(responseCode = "201", description = "Draft created; Location points to its status resource")
    @Operation(summary = "Create a draft marriage application")
    public ResponseEntity<ApplicationResponseDTO> createApplication(@Valid @RequestBody ApplicationSubmissionDTO dto) {
        ApplicationResponseDTO application = service.createDraft(dto);
        return ResponseEntity.created(URI.create("/api/v1/citizen/" + application.getId() + "/status"))
                .body(application);
    }

    @PostMapping(value = "/{id}/documents/ocr-check", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Mock document verification", description = "Checks file metadata only; does not extract text or establish identity.")
    public ResponseEntity<OcrPreflightResultDTO> checkDocuments(@PathVariable UUID id,
            @RequestPart("groomId") MultipartFile groomId, @RequestPart("brideId") MultipartFile brideId) {
        return ResponseEntity.ok(service.verifyOcrDocuments(id, groomId, brideId));
    }

    @PostMapping("/{id}/payment")
    @Operation(summary = "Simulate payment and generate a synthetic appointment", description = "Does not verify a payment with any provider or reserve a real slot.")
    public ResponseEntity<PaymentResponseDTO> pay(@PathVariable UUID id, @Valid @RequestBody PaymentRequestDTO request) {
        return ResponseEntity.ok(service.processPayment(id, request.getPaymentReference()));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Retrieve the current application")
    public ResponseEntity<ApplicationResponseDTO> status(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getApplicationById(id));
    }
}