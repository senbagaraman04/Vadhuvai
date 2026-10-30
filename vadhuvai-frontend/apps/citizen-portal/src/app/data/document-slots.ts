import { DocumentSlotKind } from '@vadhuvai/shared/util-models';

export interface DocumentSlot {
  kind: DocumentSlotKind;
  label: string;
  hint: string;
  /** Whether the document goes through AI OCR and is matched against the application. */
  ocr: boolean;
}

/** Minimum OCR confidence (0 to 100) to pass without manual correction. */
export const OCR_PASS_THRESHOLD = 90;

const ID_HINT = 'Aadhaar, Voter ID or Passport';

export const DOCUMENT_SLOTS: readonly DocumentSlot[] = [
  { kind: 'GROOM_ID', label: 'Groom ID proof', hint: ID_HINT, ocr: true },
  { kind: 'BRIDE_ID', label: 'Bride ID proof', hint: ID_HINT, ocr: true },
  {
    kind: 'INVITATION_OR_RECEIPT',
    label: 'Marriage invitation card or hall / temple receipt',
    hint: 'Any one document showing the ceremony',
    ocr: false,
  },
  {
    kind: 'GROOM_PHOTO',
    label: 'Groom photograph',
    hint: 'Recent passport-size colour photo',
    ocr: false,
  },
  {
    kind: 'BRIDE_PHOTO',
    label: 'Bride photograph',
    hint: 'Recent passport-size colour photo',
    ocr: false,
  },
  {
    kind: 'WITNESS_1_ID',
    label: 'Witness 1 ID proof',
    hint: ID_HINT,
    ocr: false,
  },
  {
    kind: 'WITNESS_2_ID',
    label: 'Witness 2 ID proof',
    hint: ID_HINT,
    ocr: false,
  },
  {
    kind: 'WITNESS_3_ID',
    label: 'Witness 3 ID proof',
    hint: ID_HINT,
    ocr: false,
  },
];

export const OCR_SLOT_KINDS: readonly DocumentSlotKind[] =
  DOCUMENT_SLOTS.filter((slot) => slot.ocr).map((slot) => slot.kind);
