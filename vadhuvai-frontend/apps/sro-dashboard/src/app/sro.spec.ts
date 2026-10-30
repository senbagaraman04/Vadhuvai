import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SroApiService, sroError } from './sro-api.service';
import { SroQueueComponent } from './sro-queue.component';
import { SroReviewComponent } from './sro-review.component';
import { SroReview } from './sro.models';

const review: SroReview = {
  application: {
    id: '00000000-0000-0000-0000-000000000001', applicationId: 'VAD-001', status: 'SLOT_LOCKED',
    groomName: 'Arun Kumar', groomDob: '1994-04-12', groomMobile: '9876543210',
    brideName: 'Meena Devi', brideDob: '1996-08-20', brideMobile: '9123456780',
    marriageDate: '2025-01-15', venueDetails: 'Community Hall', sroDistrict: 'Chennai',
    appointmentSlot: '2026-11-06T10:00:00', ocrVerified: true,
    createdAt: '2026-10-30T10:00:00', updatedAt: '2026-10-30T10:00:00',
  },
  documentUrls: [], ocrMatchConfidenceScores: {}, flags: ['DOCUMENTS_UNAVAILABLE'],
  officerRemarks: null, reviewedBy: null, reviewedAt: null,
};

describe('SRO API client', () => {
  let api: SroApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), SroApiService] });
    api = TestBed.inject(SroApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('checks officer access before sign-in and sends CSRF with decisions', () => {
    api.signIn('officer', 'test-password').subscribe();
    const csrf = http.expectOne('/api/v1/citizen/auth/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    expect(csrf.request.headers.get('Authorization')).toBe(`Basic ${btoa('officer:test-password')}`);
    csrf.flush({ token: 'csrf-test' });
    expect(api.signedIn()).toBe(false);
    http.expectOne('/api/v1/sro/queue?page=0&size=25').flush({ content: [], page: 0, totalPages: 0, totalElements: 0 });
    expect(api.signedIn()).toBe(true);
    const decision = { officerRemarks: 'Verified', digitalSignatureHash: 'a'.repeat(64), approved: true };
    api.decide(review.application.id, decision).subscribe();
    const request = http.expectOne(`/api/v1/sro/${review.application.id}/decision`);
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-test');
    expect(request.request.body).toEqual(decision);
    request.flush(review);
    api.signOut();
    expect(api.signedIn()).toBe(false);
    expect(api.officerName()).toBe('');
  });

  it('clears credentials when a non-officer attempts sign-in', () => {
    api.signIn('citizen', 'test-password').subscribe({ error: () => undefined });
    http.expectOne('/api/v1/citizen/auth/csrf').flush({ token: 'csrf-test' });
    http.expectOne('/api/v1/sro/queue?page=0&size=25').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(api.signedIn()).toBe(false);
    api.queue(2).subscribe();
    const request = http.expectOne('/api/v1/sro/queue?page=2&size=25');
    expect(request.request.headers.get('Authorization')).toBe('');
    request.flush({ content: [] });
  });

  it('does not send officer credentials to external document URLs', () => {
    let failed = false;
    api.document('https://untrusted.example/document').subscribe({ error: () => { failed = true; } });
    expect(failed).toBe(true);
    http.expectNone('https://untrusted.example/document');
  });

  it('reports forbidden and unavailable services without exposing internal errors', () => {
    expect(sroError(new HttpErrorResponse({ status: 403 }))).toContain('Officer access');
    expect(sroError(new HttpErrorResponse({ status: 0 }))).toContain('unavailable');
    expect(sroError(new HttpErrorResponse({ status: 500, error: 'secret' }))).not.toContain('secret');
  });
});

describe('SRO screens', () => {
  const api = {
    queue: vi.fn(), review: vi.fn(), decide: vi.fn(), document: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    api.queue.mockReturnValue(of({ content: [review], page: 0, totalPages: 1, totalElements: 1 }));
    api.review.mockReturnValue(of(review));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SroApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: review.application.id })) } }],
    });
  });

  it('renders the queue and a review action with the application route', async () => {
    const fixture = TestBed.createComponent(SroQueueComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Arun Kumar');
    expect(element.textContent).toContain('Meena Devi');
    expect(element.querySelector('tbody a')?.getAttribute('href')).toBe(`/sro/review/${review.application.id}`);
  });

  it('renders a useful empty queue', async () => {
    api.queue.mockReturnValue(of({ content: [], page: 0, totalPages: 0, totalElements: 0 }));
    const fixture = TestBed.createComponent(SroQueueComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No Pending Applications');
  });

  it('renders a retryable queue error', async () => {
    api.queue.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(SroQueueComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('unavailable');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });

  it('keeps submitted particulars read-only and flags missing evidence', async () => {
    const fixture = TestBed.createComponent(SroReviewComponent);
    await fixture.whenStable();
    expect(fixture.componentInstance.particulars.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No Documents Available');
    expect(fixture.nativeElement.textContent).toContain('documents unavailable');
    expect((fixture.nativeElement.querySelector('#groom-name') as HTMLInputElement).value).toBe('Arun Kumar');
  });

  it('requires remarks and a valid hash, then confirms and submits approval', async () => {
    const fixture = TestBed.createComponent(SroReviewComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.requestDecision(true);
    expect(component.confirming()).toBeNull();
    component.decision.setValue({ officerRemarks: 'Verified particulars', digitalSignatureHash: 'a'.repeat(64) });
    component.requestDecision(true);
    expect(component.confirming()).toBe(true);
    expect(api.decide).not.toHaveBeenCalled();
    api.decide.mockReturnValue(of({ ...review, application: { ...review.application, status: 'SRO_APPROVED' } }));
    component.submitDecision();
    await fixture.whenStable();
    expect(api.decide).toHaveBeenCalledWith(review.application.id, {
      officerRemarks: 'Verified particulars', digitalSignatureHash: 'a'.repeat(64), approved: true,
    });
    expect(component.notice()).toBe('Application approved.');
    expect(component.decision.disabled).toBe(true);
  });

  it('sends an explicit rejection decision rather than approval', async () => {
    const fixture = TestBed.createComponent(SroReviewComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.decision.setValue({ officerRemarks: 'Please correct the discrepancy', digitalSignatureHash: 'b'.repeat(64) });
    component.requestDecision(false);
    api.decide.mockReturnValue(of({ ...review, application: { ...review.application, status: 'SRO_QUERY_RAISED' } }));
    component.submitDecision();
    expect(api.decide.mock.calls[0][1].approved).toBe(false);
    expect(component.notice()).toBe('Rejection query recorded.');
  });
});