import { TimelineEventId } from '@vadhuvai/shared/util-models';

export const TIMELINE_EVENTS: readonly {
  id: TimelineEventId;
  label: string;
}[] = [
  { id: 'APPLICATION_SUBMITTED', label: 'Application submitted' },
  { id: 'OCR_PASSED', label: 'Documents OCR passed' },
  { id: 'FEE_PAID', label: 'Fee paid' },
  { id: 'SLOT_SCHEDULED', label: 'SRO appointment scheduled' },
];
