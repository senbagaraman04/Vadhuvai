import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { VadhuvaiStatusBadge, VadhuvaiStepper } from '@vadhuvai/shared/ui';
import { TimelineEventId } from '@vadhuvai/shared/util-models';
import { CITIZEN_STEPS } from '../../data/citizen-steps';
import { TIMELINE_EVENTS } from '../../data/timeline-events';
import { ApplicationStore } from '../../services/application-store.service';

interface TimelineRow {
  id: TimelineEventId;
  label: string;
  timestamp: string | null;
}

@Component({
  selector: 'app-status-page',
  imports: [DatePipe, RouterLink, VadhuvaiStepper, VadhuvaiStatusBadge],
  templateUrl: './status.html',
  styleUrl: './status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPage {
  protected readonly store = inject(ApplicationStore);

  protected readonly steps = CITIZEN_STEPS;

  protected readonly timelineRows = computed<TimelineRow[]>(() => {
    const entries = this.store.timeline();
    return TIMELINE_EVENTS.map((event) => ({
      id: event.id,
      label: event.label,
      timestamp:
        entries.find((entry) => entry.id === event.id)?.timestamp ?? null,
    }));
  });

  protected downloadReceipt(): void {
    window.print();
  }
}
