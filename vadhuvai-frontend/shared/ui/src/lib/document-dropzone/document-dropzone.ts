import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
  selector: 'vadhuvai-document-dropzone',
  imports: [DecimalPipe],
  templateUrl: './document-dropzone.html',
  styleUrl: './document-dropzone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VadhuvaiDocumentDropzone {
  readonly label = input.required<string>();
  readonly file = input<File | null>(null);
  /** Upload progress from 0 to 100; null when the file is not being uploaded. */
  readonly progress = input<number | null>(null);
  readonly maxSizeMb = input(5);
  readonly fileSelected = output<File>();
  readonly fileRemoved = output<void>();

  protected readonly isDragging = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly previewOpen = signal(false);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly percent = computed(() => this.progress() ?? 100);
  protected readonly uploaded = computed(() => this.percent() >= 100);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  constructor() {
    effect((onCleanup) => {
      const file = this.file();
      this.previewUrl.set(null);
      if (!file || file.type === 'application/pdf') {
        return;
      }
      const url = URL.createObjectURL(file);
      this.previewUrl.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files.item(0);
    if (file) {
      this.acceptFile(file);
    }
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) {
      this.acceptFile(file);
    }
    input.value = '';
  }

  protected openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected remove(): void {
    this.previewOpen.set(false);
    this.fileRemoved.emit();
  }

  private acceptFile(file: File): void {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.errorMessage.set('Only PDF, JPG or PNG files are accepted.');
      return;
    }
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.errorMessage.set(`File must be ${this.maxSizeMb()} MB or smaller.`);
      return;
    }
    this.errorMessage.set(null);
    this.fileSelected.emit(file);
  }
}
