import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DocumentSlotKind } from '@vadhuvai/shared/util-models';
import { DOCUMENT_SLOTS, OCR_PASS_THRESHOLD } from '../../data/document-slots';
import {
  ApplicationStore,
  isOcrPassed,
} from '../../services/application-store.service';
import { todayIsoDate } from '../../utils/date';
import { formErrorOf, notAfterToday } from '../../utils/form-validation';

interface FilePreview {
  url: string;
  isPdf: boolean;
  safeUrl: SafeResourceUrl;
}

@Component({
  selector: 'app-ocr-review-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './ocr-review-drawer.html',
  styleUrl: './ocr-review-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrReviewDrawer implements OnInit {
  readonly kind = input.required<DocumentSlotKind>();
  readonly closed = output<void>();

  private readonly store = inject(ApplicationStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly errorOf = formErrorOf;
  protected readonly today = todayIsoDate();
  protected readonly threshold = OCR_PASS_THRESHOLD;
  protected readonly doc = computed(() => this.store.documents()[this.kind()]);
  protected readonly file = computed(() => this.doc()?.file ?? null);
  protected readonly passed = computed(() => isOcrPassed(this.doc()));
  protected readonly confidence = computed(() =>
    Math.round(this.doc()?.ocr?.confidence ?? 0),
  );
  protected readonly label = computed(
    () => DOCUMENT_SLOTS.find((slot) => slot.kind === this.kind())?.label ?? '',
  );
  protected readonly preview = signal<FilePreview | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    dateOfBirth: ['', [Validators.required, notAfterToday]],
    address: ['', [Validators.required, Validators.maxLength(300)]],
  });

  constructor() {
    effect((onCleanup) => {
      const file = this.file();
      if (!file) {
        this.preview.set(null);
        return;
      }
      const url = URL.createObjectURL(file);
      this.preview.set({
        url,
        isPdf: file.type === 'application/pdf',
        safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
      });
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }

  ngOnInit(): void {
    const extracted = this.doc()?.ocr?.extracted;
    if (extracted) {
      this.form.patchValue({
        name: extracted.name,
        dateOfBirth: extracted.dateOfBirth,
        address: extracted.address,
      });
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.store.correctOcr(this.kind(), this.form.getRawValue());
    this.closed.emit();
  }
}
