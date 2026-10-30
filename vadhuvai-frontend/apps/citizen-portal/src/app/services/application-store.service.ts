import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Appointment,
  ApplicationDraft,
  ApplicationStatus,
  CeremonyDetails,
  DocumentMap,
  DocumentSlotKind,
  OcrExtraction,
  PartyDetails,
  PaymentMethod,
  PaymentReceipt,
  TimelineEntry,
  TimelineEventId,
  UploadedDocument,
} from '@vadhuvai/shared/util-models';
import { APPOINTMENT_TIME_SLOT, SRO_OFFICES } from '../data/sro-offices';
import {
  DOCUMENT_SLOTS,
  OCR_PASS_THRESHOLD,
  OCR_SLOT_KINDS,
} from '../data/document-slots';
import { FEE_TOTAL } from '../data/payment-config';
import { delay } from '../utils/async';
import { MockEpayService } from './mock-epay.service';
import { MockOcrService } from './mock-ocr.service';

const UPLOAD_STEPS = [25, 50, 75, 100];

/** True when an ID document was read with enough confidence or corrected by the citizen. */
export function isOcrPassed(doc: UploadedDocument | undefined): boolean {
  return (
    !!doc?.ocr && (doc.ocrCorrected || doc.ocr.confidence >= OCR_PASS_THRESHOLD)
  );
}

function emptyParty(): PartyDetails {
  return {
    fullName: '',
    dateOfBirth: '',
    mobileNumber: '',
    address: '',
    maritalStatus: '',
  };
}

@Injectable({ providedIn: 'root' })
export class ApplicationStore {
  private readonly ocrService = inject(MockOcrService);
  private readonly epay = inject(MockEpayService);

  readonly status = signal<ApplicationStatus>('DRAFT');
  readonly applicationId = signal<string | null>(null);
  readonly groom = signal<PartyDetails>(emptyParty());
  readonly bride = signal<PartyDetails>(emptyParty());
  readonly ceremony = signal<CeremonyDetails>({
    marriageDate: '',
    venue: '',
    sroDistrict: '',
  });
  readonly draftSavedAt = signal<string | null>(null);
  readonly documents = signal<DocumentMap>({});
  readonly timeline = signal<TimelineEntry[]>([]);
  readonly receipt = signal<PaymentReceipt | null>(null);
  readonly appointment = signal<Appointment | null>(null);

  readonly documentsComplete = computed(() => {
    const docs = this.documents();
    return DOCUMENT_SLOTS.every((slot) => docs[slot.kind]?.progress === 100);
  });

  readonly ocrPassed = computed(() => {
    const docs = this.documents();
    return OCR_SLOT_KINDS.every((kind) => isOcrPassed(docs[kind]));
  });

  readonly canProceedToPayment = computed(
    () => this.documentsComplete() && this.ocrPassed(),
  );

  saveDraft(draft: ApplicationDraft): void {
    this.groom.set(draft.groom);
    this.bride.set(draft.bride);
    this.ceremony.set(draft.ceremony);
    this.draftSavedAt.set(new Date().toISOString());
  }

  submitApplication(draft: ApplicationDraft): void {
    this.saveDraft(draft);
    if (this.applicationId()) {
      return;
    }
    this.applicationId.set(`VDV-${Date.now().toString(36).toUpperCase()}`);
    this.addTimeline('APPLICATION_SUBMITTED');
  }

  /** Simulates the upload, then runs OCR for groom and bride ID proofs. */
  async uploadDocument(kind: DocumentSlotKind, file: File): Promise<void> {
    this.documents.update((docs) => ({
      ...docs,
      [kind]: { file, progress: 0, ocr: null, ocrCorrected: false },
    }));

    for (const progress of UPLOAD_STEPS) {
      await delay(150);
      this.patchDocument(kind, { progress }, file);
    }

    if (!OCR_SLOT_KINDS.includes(kind)) {
      return;
    }
    const ocr = await this.ocrService.extract(file, this.expectedDetails(kind));
    this.patchDocument(kind, { ocr }, file);
    this.syncOcrStatus();
  }

  removeDocument(kind: DocumentSlotKind): void {
    this.documents.update((docs) => {
      const next = { ...docs };
      delete next[kind];
      return next;
    });
  }

  correctOcr(kind: DocumentSlotKind, extracted: OcrExtraction): void {
    const current = this.documents()[kind]?.ocr;
    if (!current) {
      return;
    }
    this.patchDocument(kind, {
      ocr: { ...current, extracted },
      ocrCorrected: true,
    });
    this.syncOcrStatus();
  }

  startPayment(): void {
    if (this.status() === 'OCR_VERIFIED') {
      this.status.set('PAYMENT_PENDING');
    }
  }

  async completePayment(method: PaymentMethod): Promise<void> {
    this.receipt.set(await this.epay.pay(FEE_TOTAL, method));
    this.addTimeline('FEE_PAID');
    this.appointment.set(this.buildAppointment());
    this.addTimeline('SLOT_SCHEDULED');
    this.status.set('SLOT_LOCKED');
  }

  private patchDocument(
    kind: DocumentSlotKind,
    patch: Partial<UploadedDocument>,
    file?: File,
  ): void {
    this.documents.update((docs) => {
      const current = docs[kind];
      if (!current || (file && current.file !== file)) {
        return docs;
      }
      return { ...docs, [kind]: { ...current, ...patch } };
    });
  }

  private expectedDetails(kind: DocumentSlotKind): OcrExtraction {
    const party = kind === 'GROOM_ID' ? this.groom() : this.bride();
    return {
      name: party.fullName,
      dateOfBirth: party.dateOfBirth,
      address: party.address,
    };
  }

  private syncOcrStatus(): void {
    if (this.ocrPassed() && this.status() === 'DRAFT') {
      this.status.set('OCR_VERIFIED');
      this.addTimeline('OCR_PASSED');
    }
  }

  private addTimeline(id: TimelineEventId): void {
    this.timeline.update((entries) => [
      ...entries,
      { id, timestamp: new Date().toISOString() },
    ]);
  }

  private buildAppointment(): Appointment {
    const { marriageDate, sroDistrict } = this.ceremony();
    const office = SRO_OFFICES.find((item) => item.code === sroDistrict);
    return {
      applicationId: this.applicationId() ?? '',
      officeName: office?.officeName ?? 'Sub-Registrar Office',
      officeAddress: office?.address ?? '',
      appointmentDate: marriageDate,
      timeSlot: APPOINTMENT_TIME_SLOT,
      gateEntryCode: String(Math.floor(100000 + Math.random() * 900000)),
    };
  }
}
