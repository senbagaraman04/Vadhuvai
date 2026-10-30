package org.vadhuvai.vadhuvai_api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.vadhuvai.vadhuvai_api.domain.ApplicationState;
import org.vadhuvai.vadhuvai_api.domain.MarriageApplication;
import org.vadhuvai.vadhuvai_api.exception.GlobalExceptionHandler;
import org.vadhuvai.vadhuvai_api.repository.MarriageApplicationRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class VadhuvaiApiApplicationTests {
    private static final String BASE = "/api/v1/citizen";
    private static final String SUBMISSION = """
	    {
	      "groomName": "Arun Kumar", "groomDob": "1994-04-12", "groomMobile": "9876543210",
	      "brideName": "Meena Devi", "brideDob": "1996-08-20", "brideMobile": "9123456780",
	      "marriageDate": "2025-01-15", "venueDetails": "Community Hall, Chennai",
	      "sroDistrict": "Chennai"
	    }
	    """;

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper mapper;
    @Autowired
    private MarriageApplicationRepository repository;

    @Test
    void completesCitizenWorkflowAndPreservesApplicationDetails() throws Exception {
	JsonNode draft = createDraft();
	String id = draft.get("id").asText();
	assertThat(draft.get("status").asText()).isEqualTo("DRAFT");
	assertThat(draft.get("ocrVerified").asBoolean()).isFalse();
	assertThat(draft.get("createdAt").asText()).isNotBlank();
	assertThat(draft.get("groomDob").asText()).isEqualTo("1994-04-12");

	verifyDocuments(id);
	mvc.perform(get(BASE + "/" + id + "/status"))
		.andExpect(status().isOk())
		.andExpect(jsonPath("$.status").value("DOCUMENT_VERIFIED"))
		.andExpect(jsonPath("$.ocrVerified").value(true));

	mvc.perform(post(BASE + "/" + id + "/payment").with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"paymentReference\":\"EPAY-123\"}"))
		.andExpect(status().isOk())
		.andExpect(jsonPath("$.application.status").value("SLOT_LOCKED"))
		.andExpect(jsonPath("$.appointmentSlip.applicationId").value(draft.get("applicationId").asText()))
		.andExpect(jsonPath("$.appointmentSlip.paymentReference").value("EPAY-123"))
		.andExpect(jsonPath("$.appointmentSlip.synthetic").value(true))
		.andExpect(jsonPath("$.appointmentSlip.appointmentAt").exists());

	mvc.perform(get(BASE + "/" + id + "/status"))
		.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("SLOT_LOCKED"));
	mvc.perform(multipart(BASE + "/" + id + "/documents/ocr-check")
			.file(document("groomId")).file(document("brideId")).with(csrf()))
		.andExpect(status().isBadRequest());
	mvc.perform(post(BASE + "/" + id + "/payment").with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"paymentReference\":\"EPAY-123\"}"))
		.andExpect(status().isBadRequest());
    }

    @Test
    void repositoryLookupsAndLifecycleTimestampsWork() throws Exception {
	JsonNode draft = createDraft();
	UUID id = UUID.fromString(draft.get("id").asText());
	MarriageApplication application = repository.findByApplicationId(draft.get("applicationId").asText()).orElseThrow();
	LocalDateTime created = application.getCreatedAt();
	assertThat(repository.findByGroomMobile("9876543210")).extracting(MarriageApplication::getId).contains(id);
	assertThat(repository.findByBrideMobile("9123456780")).extracting(MarriageApplication::getId).contains(id);
	assertThat(repository.findByGroomMobileOrBrideMobile("0000000000", "9123456780"))
		.extracting(MarriageApplication::getId).contains(id);
	application.setVenueDetails("Updated Hall");
	repository.saveAndFlush(application);
	assertThat(application.getCreatedAt()).isEqualTo(created);
	assertThat(application.getUpdatedAt()).isAfterOrEqualTo(created);
    }

    @Test
    void rejectsPaymentBeforeVerificationAndInvalidReferences() throws Exception {
	String id = createDraft().get("id").asText();
	mvc.perform(post(BASE + "/" + id + "/payment").with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"paymentReference\":\"EPAY-123\"}"))
		.andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
	verifyDocuments(id);
	mvc.perform(post(BASE + "/" + id + "/payment").with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"paymentReference\":\" \"}"))
		.andExpect(status().isBadRequest()).andExpect(jsonPath("$.details[0].paymentReference").exists());
	assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
		.isEqualTo(ApplicationState.DOCUMENT_VERIFIED);
    }

    @Test
    void rejectsEmptyUnsupportedAndMissingDocumentsWithoutChangingState() throws Exception {
	String id = createDraft().get("id").asText();
	mvc.perform(multipart(BASE + "/" + id + "/documents/ocr-check")
			.file(new MockMultipartFile("groomId", "empty.png", "image/png", new byte[0]))
			.file(document("brideId")).with(csrf()))
		.andExpect(status().isBadRequest());
	mvc.perform(multipart(BASE + "/" + id + "/documents/ocr-check")
			.file(new MockMultipartFile("groomId", "id.txt", "text/plain", new byte[]{1}))
			.file(document("brideId")).with(csrf()))
		.andExpect(status().isBadRequest());
	mvc.perform(multipart(BASE + "/" + id + "/documents/ocr-check").file(document("groomId")).with(csrf()))
		.andExpect(status().isBadRequest());
	assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus()).isEqualTo(ApplicationState.DRAFT);
    }

    @Test
    void returnsFieldValidationErrors() throws Exception {
	mvc.perform(post(BASE + "/application").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
		.andExpect(status().isBadRequest())
		.andExpect(jsonPath("$.message").value("Validation failed"))
		.andExpect(jsonPath("$.timestamp").exists())
		.andExpect(jsonPath("$.details[0].groomName").exists())
		.andExpect(jsonPath("$.details[0].brideDob").exists());
	mvc.perform(post(BASE + "/auth/otp").with(csrf()).contentType(MediaType.APPLICATION_JSON)
			.content("{\"mobile\":\"123\"}"))
		.andExpect(status().isBadRequest()).andExpect(jsonPath("$.details[0].mobile").exists());
    }

    @Test
    void returnsNotFoundAndMalformedInputErrors() throws Exception {
	mvc.perform(get(BASE + "/" + UUID.randomUUID() + "/status"))
		.andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404))
		.andExpect(jsonPath("$.timestamp").exists());
	mvc.perform(get(BASE + "/invalid-uuid/status")).andExpect(status().isBadRequest());
	mvc.perform(post(BASE + "/application").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{"))
		.andExpect(status().isBadRequest());
    }

    @Test
    void mockOtpMasksPhoneAndReturnsChallengeNotCredential() throws Exception {
	mvc.perform(post(BASE + "/auth/otp").with(anonymous()).with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content("{\"mobile\":\"9876543210\"}"))
		.andExpect(status().isOk()).andExpect(jsonPath("$.maskedPhone").value("******3210"))
		.andExpect(jsonPath("$.sessionToken").value(org.hamcrest.Matchers.startsWith("mock-")));
    }

    @Test
    void requiresAuthenticationAndCsrfAndExposesCsrfToken() throws Exception {
	mvc.perform(get(BASE + "/" + UUID.randomUUID() + "/status").with(anonymous()))
		.andExpect(status().isUnauthorized());
	mvc.perform(post(BASE + "/application").contentType(MediaType.APPLICATION_JSON).content(SUBMISSION))
		.andExpect(status().isForbidden());
	mvc.perform(get(BASE + "/auth/csrf"))
		.andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty())
		.andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"));
    }

	@Test
	void deniesCitizenAndAnonymousAccessToEverySroEndpoint() throws Exception {
		String id = UUID.randomUUID().toString();
		mvc.perform(get("/api/v1/sro/queue")).andExpect(status().isForbidden());
		mvc.perform(get("/api/v1/sro/" + id + "/review")).andExpect(status().isForbidden());
		mvc.perform(post("/api/v1/sro/" + id + "/decision").with(csrf())
						.contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isForbidden());
		mvc.perform(get("/api/v1/sro/queue").with(anonymous())).andExpect(status().isUnauthorized());
	}

    @Test
    void allowsOnlyConfiguredFrontendOrigins() throws Exception {
	for (String origin : new String[]{"http://localhost:4200", "http://localhost:4201", "http://localhost:4202"}) {
	    mvc.perform(options(BASE + "/application").with(anonymous()).header("Origin", origin)
			    .header("Access-Control-Request-Method", "POST")
				    .header("Access-Control-Request-Headers", "content-type,x-csrf-token,authorization"))
			    .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", origin))
			    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
	}
	mvc.perform(options(BASE + "/application").header("Origin", "https://untrusted.example")
			.header("Access-Control-Request-Method", "POST"))
		.andExpect(status().isForbidden());
    }

	    @Test
	    @WithMockUser(username = "officer-one", roles = "SRO_OFFICER")
	    void officerCanReviewApproveAndAuditAnApplication() throws Exception {
		String id = createLockedApplication();
		createDraft();
		mvc.perform(get("/api/v1/sro/queue"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
			.andExpect(jsonPath("$.content[0].application.id").value(id))
			.andExpect(jsonPath("$.content[0].application.appointmentSlot").isNotEmpty());
		mvc.perform(get("/api/v1/sro/" + id + "/review"))
			.andExpect(status().isOk()).andExpect(jsonPath("$.documentUrls").isEmpty())
			.andExpect(jsonPath("$.ocrMatchConfidenceScores").isEmpty())
			.andExpect(jsonPath("$.flags").value(org.hamcrest.Matchers.hasItem("DOCUMENTS_UNAVAILABLE")));
		mvc.perform(post("/api/v1/sro/" + id + "/decision").with(csrf())
				.contentType(MediaType.APPLICATION_JSON).content(decision(true)))
			.andExpect(status().isOk()).andExpect(jsonPath("$.application.status").value("SRO_APPROVED"))
			.andExpect(jsonPath("$.reviewedBy").value("officer-one"))
			.andExpect(jsonPath("$.reviewedAt").isNotEmpty());
		MarriageApplication saved = repository.findById(UUID.fromString(id)).orElseThrow();
		assertThat(saved.getDigitalSignatureHash()).isEqualTo("a".repeat(64));
		assertThat(saved.getOfficerRemarks()).isEqualTo("Reviewed particulars");
		mvc.perform(get("/api/v1/sro/queue")).andExpect(jsonPath("$.totalElements").value(0));
		mvc.perform(post("/api/v1/sro/" + id + "/decision").with(csrf())
				.contentType(MediaType.APPLICATION_JSON).content(decision(false)))
			.andExpect(status().isBadRequest());
	    }

	    @Test
	    @WithMockUser(roles = "SRO_OFFICER")
	    void officerCanRaiseRejectionQueryButCannotDecideDrafts() throws Exception {
		String id = createLockedApplication();
		mvc.perform(post("/api/v1/sro/" + id + "/decision").with(csrf())
				.contentType(MediaType.APPLICATION_JSON).content(decision(false)))
			.andExpect(status().isOk()).andExpect(jsonPath("$.application.status").value("SRO_QUERY_RAISED"));
		mvc.perform(get("/api/v1/sro/queue")).andExpect(jsonPath("$.totalElements").value(0));
		String draftId = createDraft().get("id").asText();
		mvc.perform(post("/api/v1/sro/" + draftId + "/decision").with(csrf())
				.contentType(MediaType.APPLICATION_JSON).content(decision(true)))
			.andExpect(status().isBadRequest());
	    }

	    @Test
	    @WithMockUser(roles = "SRO_OFFICER")
	    void validatesOfficerRequestsAndRequiresCsrf() throws Exception {
		String id = createLockedApplication();
		mvc.perform(post("/api/v1/sro/" + id + "/decision").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"officerRemarks\":\"\",\"digitalSignatureHash\":\"bad\",\"approved\":true}"))
			.andExpect(status().isBadRequest()).andExpect(jsonPath("$.details[0].officerRemarks").exists())
			.andExpect(jsonPath("$.details[0].digitalSignatureHash").exists());
		mvc.perform(post("/api/v1/sro/" + id + "/decision").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"officerRemarks\":\"Review\",\"digitalSignatureHash\":\"" + "a".repeat(64) + "\"}"))
			.andExpect(status().isBadRequest());
		mvc.perform(post("/api/v1/sro/" + id + "/decision").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(decision(true).replace("true", "null")))
			.andExpect(status().isBadRequest());
		mvc.perform(post("/api/v1/sro/" + id + "/decision").contentType(MediaType.APPLICATION_JSON).content(decision(true)))
			.andExpect(status().isForbidden());
		mvc.perform(get("/api/v1/sro/queue?page=-1")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/v1/sro/queue?size=101")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/v1/sro/" + UUID.randomUUID() + "/review")).andExpect(status().isNotFound());
	    }

	    private String createLockedApplication() throws Exception {
		String id = createDraft().get("id").asText();
		verifyDocuments(id);
		mvc.perform(post(BASE + "/" + id + "/payment").with(csrf())
				.contentType(MediaType.APPLICATION_JSON).content("{\"paymentReference\":\"EPAY-SRO\"}"))
			.andExpect(status().isOk());
		return id;
	    }

	    private String decision(boolean approved) {
		return "{\"officerRemarks\":\"Reviewed particulars\",\"digitalSignatureHash\":\""
			+ "a".repeat(64) + "\",\"approved\":" + approved + "}";
	    }

	    @Test
	    void browserCanUseIssuedCsrfTokenForCredentialedSubmission() throws Exception {
		var result = mvc.perform(get(BASE + "/auth/csrf").header("Origin", "http://localhost:4201"))
			.andExpect(status().isOk()).andReturn();
		JsonNode token = mapper.readTree(result.getResponse().getContentAsString());
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
		assertThat(session).isNotNull();
		mvc.perform(post(BASE + "/application").session(session)
				.header("Origin", "http://localhost:4201")
				.header(token.get("headerName").asText(), token.get("token").asText())
				.contentType(MediaType.APPLICATION_JSON).content(SUBMISSION))
			.andExpect(status().isCreated())
			.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4201"));
	    }

    @Test
    void openApiDescribesCitizenEndpoints() throws Exception {
	mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
		.andExpect(jsonPath("$.paths['/api/v1/citizen/application'].post").exists())
		.andExpect(jsonPath("$.paths['/api/v1/citizen/{id}/documents/ocr-check'].post").exists())
		.andExpect(jsonPath("$.paths['/api/v1/citizen/{id}/payment'].post").exists());
    }

    @Test
    void genericErrorDoesNotExposeInternalExceptionMessage() {
	var response = new GlobalExceptionHandler().handleUnexpected(new RuntimeException("sensitive database detail"));
	assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
	assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
	assertThat(response.getBody().details()).isEmpty();
    }

    private JsonNode createDraft() throws Exception {
	String body = mvc.perform(post(BASE + "/application").with(csrf())
			.contentType(MediaType.APPLICATION_JSON).content(SUBMISSION))
		.andExpect(status().isCreated()).andExpect(header().exists("Location"))
		.andReturn().getResponse().getContentAsString();
	return mapper.readTree(body);
    }

    private void verifyDocuments(String id) throws Exception {
	mvc.perform(multipart(BASE + "/" + id + "/documents/ocr-check")
			.file(document("groomId")).file(document("brideId")).with(csrf()))
		.andExpect(status().isOk()).andExpect(jsonPath("$.matched").value(true))
		.andExpect(jsonPath("$.confidenceScore").value(1.0));
    }

    private MockMultipartFile document(String name) {
	return new MockMultipartFile(name, "id.png", "image/png", new byte[]{1, 2, 3});
    }

}
