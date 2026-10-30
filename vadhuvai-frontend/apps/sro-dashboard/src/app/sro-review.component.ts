import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap, tap } from 'rxjs';
import { SroApiService, sroError } from './sro-api.service';
import { SroReview } from './sro.models';
import { SroDocumentComponent } from './sro-document.component';

@Component({
  selector: 'app-sro-review',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, SroDocumentComponent],
  styleUrl: './sro.scss',
  templateUrl: './sro-review.component.html',
})
export class SroReviewComponent {
  private readonly api = inject(SroApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly builder = inject(FormBuilder);
  readonly review = signal<SroReview | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly confirming = signal<boolean | null>(null);
  readonly particulars = this.builder.nonNullable.group({
    groomName: [''], groomDob: [''], groomMobile: [''], brideName: [''], brideDob: [''], brideMobile: [''],
    marriageDate: [''], venueDetails: [''], sroDistrict: [''],
  });
  readonly decision = this.builder.nonNullable.group({
    officerRemarks: ['', [Validators.required, Validators.maxLength(2000), Validators.pattern(/\S/)]],
    digitalSignatureHash: ['', [Validators.required, Validators.pattern(/^[a-fA-F0-9]{64}$/)]],
  });

  constructor() {
    this.route.paramMap.pipe(
      tap(() => { this.loading.set(true); this.error.set(''); this.review.set(null); this.notice.set(''); this.confirming.set(null); this.decision.reset(); }),
      switchMap((params) => this.api.review(params.get('id') ?? '')),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (review) => { this.setReview(review); this.loading.set(false); },
      error: (error: unknown) => { this.error.set(sroError(error)); this.loading.set(false); },
    });
  }

  requestDecision(approved: boolean) {
    this.decision.markAllAsTouched();
    if (this.decision.invalid || this.saving() || this.review()?.application.status !== 'SLOT_LOCKED') return;
    this.confirming.set(approved);
  }

  submitDecision() {
    const approved = this.confirming();
    const review = this.review();
    if (approved === null || !review || this.decision.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.decide(review.application.id, { ...this.decision.getRawValue(), approved }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (result) => {
        this.setReview(result);
        this.confirming.set(null);
        this.decision.controls.digitalSignatureHash.reset();
        this.notice.set(approved ? 'Application approved.' : 'Rejection query recorded.');
      },
      error: (error: unknown) => { this.confirming.set(null); this.error.set(sroError(error)); },
    });
  }

  private setReview(review: SroReview) {
    this.review.set(review);
    this.particulars.patchValue(review.application);
    this.particulars.disable();
    if (review.officerRemarks) this.decision.controls.officerRemarks.setValue(review.officerRemarks);
    if (review.application.status !== 'SLOT_LOCKED') this.decision.disable();
    else this.decision.enable();
  }

  flagLabel(flag: string) { return flag.toLowerCase().replace(/_/g, ' '); }
}