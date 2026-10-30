import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DecimalPipe } from '@angular/common';
import { SroApiService } from './sro-api.service';

@Component({
  selector: 'app-sro-document',
  imports: [DecimalPipe],
  styleUrl: './sro.scss',
  template: `
    <article class="card sro-document mb-3">
      <div class="card-header bg-white d-flex flex-wrap justify-content-between gap-2 align-items-center">
        <h4 class="h6 mb-0">Document {{ index() + 1 }}</h4>
        @if (confidence(); as score) {
          <span class="badge rounded-pill" [class.text-bg-success]="score >= 0.9" [class.text-bg-danger]="score < 0.9">OCR {{ score * 100 | number:'1.0-1' }}%</span>
        } @else if (confidence() === 0) { <span class="badge rounded-pill text-bg-danger">OCR 0%</span> }
        @else { <span class="badge rounded-pill text-bg-secondary">OCR Unavailable</span> }
      </div>
      <div class="sro-document-body">
        @if (image()) { <img [src]="image()" [alt]="'Identity document ' + (index() + 1)" /> }
        @else if (pdf()) { <iframe [src]="pdf()" [title]="'Document ' + (index() + 1) + ' PDF preview'"></iframe> }
        @else { <p class="text-secondary text-center p-4 mb-0" role="status">{{ error() || 'Loading document...' }}</p> }
      </div>
    </article>
  `,
})
export class SroDocumentComponent implements OnInit {
  readonly url = input.required<string>();
  readonly index = input(0);
  readonly confidence = input<number | undefined>();
  readonly image = signal('');
  readonly pdf = signal<SafeResourceUrl | null>(null);
  readonly error = signal('');
  private readonly api = inject(SroApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private objectUrl = '';

  constructor() {
    this.destroyRef.onDestroy(() => { if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); });
  }

  ngOnInit() {
    this.api.document(this.url()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(blob.type)) {
          this.error.set('Document format cannot be previewed.');
          return;
        }
        this.objectUrl = URL.createObjectURL(blob);
        if (blob.type === 'application/pdf') this.pdf.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
        else this.image.set(this.objectUrl);
      },
      error: () => this.error.set('Document preview is unavailable.'),
    });
  }
}