package org.vadhuvai.vadhuvai_api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "marriage_applications")
@Getter
@Setter
@NoArgsConstructor
public class MarriageApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, updatable = false, length = 40)
    private String applicationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ApplicationState status = ApplicationState.DRAFT;

    @Column(nullable = false, length = 150)
    private String groomName;
    @Column(nullable = false)
    private LocalDate groomDob;
    @Column(nullable = false, length = 10)
    private String groomMobile;
    @Column(nullable = false, length = 150)
    private String brideName;
    @Column(nullable = false)
    private LocalDate brideDob;
    @Column(nullable = false, length = 10)
    private String brideMobile;
    @Column(nullable = false)
    private LocalDate marriageDate;
    @Column(nullable = false, length = 1000)
    private String venueDetails;
    @Column(nullable = false, length = 100)
    private String sroDistrict;
    @Column(nullable = false)
    private Boolean ocrVerified = false;
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    private LocalDateTime appointmentSlot;
    @Column(length = 2000)
    private String officerRemarks;
    @Column(length = 64)
    private String digitalSignatureHash;
    @Column(length = 150)
    private String reviewedBy;
    private LocalDateTime reviewedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}