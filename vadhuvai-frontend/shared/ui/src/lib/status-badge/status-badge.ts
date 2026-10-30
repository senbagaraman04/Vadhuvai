import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ApplicationStatus } from '@vadhuvai/shared/util-models';

export type BadgeTone = 'amber' | 'emerald' | 'indigo' | 'crimson';

const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  DRAFT: 'amber',
  OCR_VERIFIED: 'emerald',
  PAYMENT_PENDING: 'amber',
  SLOT_LOCKED: 'indigo',
  REJECTED: 'crimson',
};

@Component({
  selector: 'vadhuvai-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VadhuvaiStatusBadge {
  readonly status = input.required<ApplicationStatus>();
  protected readonly tone = computed(() => STATUS_TONES[this.status()]);
}
