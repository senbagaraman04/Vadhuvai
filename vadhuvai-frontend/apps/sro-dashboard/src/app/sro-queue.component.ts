import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SroApiService, sroError } from './sro-api.service';
import { SroQueue } from './sro.models';

@Component({
  selector: 'app-sro-queue',
  imports: [DatePipe, RouterLink],
  styleUrl: './sro.scss',
  templateUrl: './sro-queue.component.html',
})
export class SroQueueComponent {
  private readonly api = inject(SroApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly result = signal<SroQueue | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() { this.load(); }

  load(page = 0) {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.api.queue(page).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({ next: (result) => this.result.set(result), error: (error: unknown) => this.error.set(sroError(error)) });
  }
}