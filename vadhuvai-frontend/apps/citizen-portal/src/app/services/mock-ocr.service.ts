import { Injectable } from '@angular/core';
import { OcrExtraction, OcrResult } from '@vadhuvai/shared/util-models';
import { delay } from '../utils/async';

@Injectable({ providedIn: 'root' })
export class MockOcrService {
  /**
   * Mock OCR. Files whose name contains "blur" simulate an unreadable scan
   * (low confidence and no name extracted) so the manual correction path can be tested.
   */
  async extract(file: File, expected: OcrExtraction): Promise<OcrResult> {
    await delay(1200);
    if (file.name.toLowerCase().includes('blur')) {
      return { confidence: 62, extracted: { ...expected, name: '' } };
    }
    return { confidence: 98, extracted: { ...expected } };
  }
}
