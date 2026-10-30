package org.vadhuvai.vadhuvai_api.repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.vadhuvai.vadhuvai_api.domain.ApplicationState;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.vadhuvai.vadhuvai_api.domain.MarriageApplication;

public interface MarriageApplicationRepository extends JpaRepository<MarriageApplication, UUID> {
    Optional<MarriageApplication> findByApplicationId(String applicationId);
    List<MarriageApplication> findByGroomMobile(String groomMobile);
    List<MarriageApplication> findByBrideMobile(String brideMobile);
    List<MarriageApplication> findByGroomMobileOrBrideMobile(String groomMobile, String brideMobile);
    Page<MarriageApplication> findByStatus(ApplicationState status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select application from MarriageApplication application where application.id = :id")
    Optional<MarriageApplication> findByIdForUpdate(@Param("id") UUID id);
}