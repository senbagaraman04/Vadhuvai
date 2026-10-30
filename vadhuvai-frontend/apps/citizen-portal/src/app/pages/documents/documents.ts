import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VadhuvaiDocumentDropzone, VadhuvaiStepper } from '@vadhuvai/shared/ui';
import { DocumentSlotKind } from '@vadhuvai/shared/util-models';
import { CITIZEN_STEPS } from '../../data/citizen-steps';
import { DOCUMENT_SLOTS } from '../../data/document-slots';
import {
  ApplicationStore,
  isOcrPassed,
} from '../../services/application-store.service';
import { OcrReviewDrawer } from './ocr-review-drawer';

@Component({
  selector: 'app-documents-page',
  imports: [
    RouterLink,
    VadhuvaiDocumentDropzone,
    VadhuvaiStepper,
    OcrReviewDrawer,
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsPage {
  private readonly router = inject(Router);
  protected readonly store = inject(ApplicationStore);

  protected readonly steps = CITIZEN_STEPS;
  protected readonly slots = DOCUMENT_SLOTS;
  protected readonly isOcrPassed = isOcrPassed;
  protected readonly reviewKind = signal<DocumentSlotKind | null>(null);

  protected readonly uploadedCount = computed(
    () =>
      this.slots.filter(
        (slot) => this.store.documents()[slot.kind]?.progress === 100,
      ).length,
  );

  protected upload(kind: DocumentSlotKind, file: File): void {
    void this.store.uploadDocument(kind, file);
  }

  protected remove(kind: DocumentSlotKind): void {
    this.store.removeDocument(kind);
    if (this.reviewKind() === kind) {
      this.reviewKind.set(null);
    }
  }

  protected proceed(): void {
    if (!this.store.canProceedToPayment()) {
      return;
    }
    void this.router.navigateByUrl('/citizen/payment');
  }
}
