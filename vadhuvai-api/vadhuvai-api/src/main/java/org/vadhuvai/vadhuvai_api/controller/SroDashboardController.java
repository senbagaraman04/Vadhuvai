package org.vadhuvai.vadhuvai_api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vadhuvai.vadhuvai_api.dto.SroApprovalRequestDTO;
import org.vadhuvai.vadhuvai_api.dto.SroQueueDTO;
import org.vadhuvai.vadhuvai_api.dto.SroReviewDTO;
import org.vadhuvai.vadhuvai_api.service.SroDashboardService;

@RestController
@RequestMapping("/api/v1/sro")
@RequiredArgsConstructor
@Tag(name = "SRO Dashboard", description = "Requires ROLE_SRO_OFFICER")
public class SroDashboardController {
    private final SroDashboardService service;

    @GetMapping("/queue")
    @Operation(summary = "List pending SLOT_LOCKED applications, oldest first")
    public SroQueueDTO queue(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) {
        return service.getQueue(page, size);
    }

    @GetMapping("/{id}/review")
    @Operation(summary = "Retrieve application details, evidence availability and review flags")
    public SroReviewDTO review(@PathVariable UUID id) {
        return service.getReview(id);
    }

    @PostMapping("/{id}/decision")
    @Operation(summary = "Record an officer approval or rejection query", description = "The submitted hash is audit metadata, not cryptographic signature verification.")
    public SroReviewDTO decide(@PathVariable UUID id, @Valid @RequestBody SroApprovalRequestDTO request, Principal officer) {
        return service.decide(id, request, officer.getName());
    }
}