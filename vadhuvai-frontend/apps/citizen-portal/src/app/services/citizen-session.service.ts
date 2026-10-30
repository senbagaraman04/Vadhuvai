import { Injectable, signal } from '@angular/core';
import { delay } from '../utils/async';

/** Demo OTP accepted by the mock session. Replace with the real OTP gateway. */
export const MOCK_OTP = '123456';

@Injectable({ providedIn: 'root' })
export class CitizenSession {
  readonly mobileNumber = signal('');
  readonly verified = signal(false);

  async requestOtp(mobileNumber: string): Promise<void> {
    await delay(800);
    this.mobileNumber.set(mobileNumber);
  }

  async verifyOtp(code: string): Promise<boolean> {
    await delay(600);
    const ok = code === MOCK_OTP;
    this.verified.set(ok);
    return ok;
  }
}
