export type DocumentSlotKind =
  | 'GROOM_ID'
  | 'BRIDE_ID'
  | 'INVITATION_OR_RECEIPT'
  | 'GROOM_PHOTO'
  | 'BRIDE_PHOTO'
  | 'WITNESS_1_ID'
  | 'WITNESS_2_ID'
  | 'WITNESS_3_ID';

export interface OcrExtraction {
  name: string;
  dateOfBirth: string;
  address: string;
}

export interface OcrResult {
  /** Confidence score from 0 to 100. */
  confidence: number;
  extracted: OcrExtraction;
}

export interface UploadedDocument {
  file: File;
  /** Upload progress from 0 to 100. */
  progress: number;
  ocr: OcrResult | null;
  ocrCorrected: boolean;
}

export type DocumentMap = Partial<Record<DocumentSlotKind, UploadedDocument>>;
