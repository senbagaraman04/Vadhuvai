# Vadhuvai Citizen API

Spring Boot 3.5.7, Java 17+, Lombok, Jakarta Validation, Spring Data JPA,
Spring Security, and springdoc OpenAPI.

## Run and Test

From this directory, with `JAVA_HOME` pointing to a JDK (not a JRE):

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

The API listens on port 8080. The default embedded H2 database is in memory:
all records disappear when the process stops. Configure an external datasource,
its JDBC driver, and versioned migrations before using persistent data.
Entity lifecycle timestamps are UTC `LocalDateTime` values.

## Authentication and Browser Access

This is a development scaffold, not production citizen authentication.
Spring Security protects all routes except `POST /api/v1/citizen/auth/otp`.
Use HTTP Basic with username `user` and the generated development password
printed at startup. Do not commit credentials. Swagger UI at
`http://localhost:8080/swagger-ui/index.html` and the OpenAPI specification at
`http://localhost:8080/v3/api-docs` also require Basic authentication.

CSRF protection remains enabled, including for OTP requests. First make an
authenticated `GET /api/v1/citizen/auth/csrf`; retain its session cookie and send
the returned token using the returned header name (`X-CSRF-TOKEN`) on every
POST. Frontend fetch requests need `credentials: 'include'` and authentication.
CORS allows only `http://localhost:4200`, `http://localhost:4201`, and `http://localhost:4202`, including
credentialed requests and the CSRF header. Security-filter failures use Spring
Security's 401/403 responses, not the controller advice's error record.

## Endpoints

All paths below are relative to `/api/v1/citizen`.

| Method | Path | Payload | Success |
| --- | --- | --- | --- |
| GET | `/auth/csrf` | None | 200, CSRF token metadata |
| POST | `/auth/otp` | `{"mobile":"9876543210"}` | 200, sessionToken and maskedPhone |
| POST | `/application` | Submission JSON below | 201, application and Location header |
| POST | `/{id}/documents/ocr-check` | Multipart `groomId` and `brideId` | 200, OCR result |
| POST | `/{id}/payment` | `{"paymentReference":"EPAY-123"}` | 200, application and appointmentSlip |
| GET | `/{id}/status` | None | 200, complete application |

```json
{
  "groomName": "Arun Kumar",
  "groomDob": "1994-04-12",
  "groomMobile": "9876543210",
  "brideName": "Meena Devi",
  "brideDob": "1996-08-20",
  "brideMobile": "9123456780",
  "marriageDate": "2025-01-15",
  "venueDetails": "Community Hall, Chennai",
  "sroDistrict": "Chennai"
}
```

Phone numbers must be 10-digit Indian mobile numbers without a country prefix.
Birth dates must be in the past and marriage dates cannot be in the future.
Names are limited to 150 characters, venue to 1000, and district to 100.

## Workflow and Mocks

`DRAFT -> DOCUMENT_VERIFIED -> PAYMENT_PENDING -> SLOT_LOCKED`.
Payment's pending and locked states are saved in one transaction; a failure
rolls back both. Mutation lookups use a pessimistic write lock. Invalid or
repeated transitions return 400 rather than regressing application state.
Officers can move `SLOT_LOCKED` to `SRO_APPROVED` or `SRO_QUERY_RAISED`.

OTP creates only a random `mock-` challenge and masked phone; no SMS is sent,
no OTP is verified, and the token cannot authenticate a request.
OCR accepts nonempty JPEG, PNG, or PDF uploads up to 5 MB each, checks declared
metadata only, and returns a simulated match with confidence 1.0 and an empty
extracted-field map. Files are not stored or parsed.
Payment validates reference syntax only; it does not contact a payment provider.
Its synthetic slip schedules a placeholder appointment seven days ahead at
10:00 server-local time. That placeholder slot is persisted for officer review;
it does not reserve a real SRO slot or persist a receipt.

## SRO Officer API

Every `/api/v1/sro/**` endpoint requires the exact authority `ROLE_SRO_OFFICER`.
Authenticated citizens receive 403 and anonymous callers receive 401. POST
requests also require the existing session-bound CSRF token.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/sro/queue?page=0&size=25` | Pending SLOT_LOCKED applications, oldest first |
| GET | `/api/v1/sro/{id}/review` | Complete application, document URLs, OCR confidence map and flags |
| POST | `/api/v1/sro/{id}/decision` | Approve or raise a rejection query |

The queue response has `content`, `page`, `totalPages`, and `totalElements`.
Page numbers are zero-based; size must be 1 through 100. Each content entry is
an `SroReviewDTO`. Confidence-map keys correspond to document URLs.

```json
{
  "officerRemarks": "Particulars reviewed against submitted evidence",
  "digitalSignatureHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "approved": true
}
```

Remarks are required and limited to 2,000 characters; the hash must be 64 hex
characters; `approved` must be explicitly true or false (not missing or null).
The hash above is only a format example, not a valid signature. Hashes are stored
as audit metadata, not cryptographically verified signatures. Decisions persist
the authenticated officer name, UTC review timestamp, remarks and hash. Write
locking prevents duplicate decisions. Non-SLOT_LOCKED decisions return 400.
Both outcomes remove the application from the pending queue. Query resolution
and citizen resubmission are not implemented in this iteration.

The current citizen upload mock does not store documents or actual OCR scores.
Reviews therefore return empty document and confidence collections, with
`DOCUMENTS_UNAVAILABLE` and `MOCK_OCR_NOT_IDENTITY_VERIFICATION` flags. No evidence
URLs or identity-match scores are fabricated. Missing slots are also flagged.
Production approval must use retained evidence and real OCR/signature verification.

For local officer access, start with the opt-in development profile:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=sro-dev"
```

Sign in as `sro-officer` using the random password printed at startup. No officer
password is committed. This profile grants a single development account officer
authority; it must not be used as a production identity or district-authorization
model. Without this profile, the generated default user has no officer role.

## Error Contract

Controller errors contain `timestamp`, numeric `status`, `message`, and a
`details` list. Validation returns 400 with a field-error map inside that list:

```json
{
  "timestamp": "2026-10-30T12:00:00Z",
  "status": 400,
  "message": "Validation failed",
  "details": [{"groomName": "must not be blank"}]
}
```

Unknown applications return 404. Malformed JSON, UUIDs, missing multipart parts,
invalid transitions, and oversized uploads return 400. Unsupported content types
and HTTP methods return 415 and 405 respectively. Unexpected failures return
500 without exposing exception messages.

Before production, replace all mocks, implement verified citizen identity and
per-application ownership authorization, use HTTPS, add OTP rate limiting,
verify uploads by content, enforce applicable marriage eligibility rules, and
persist provider-verified payments and real appointment allocations. The default
development user can access every application and is not an ownership model.