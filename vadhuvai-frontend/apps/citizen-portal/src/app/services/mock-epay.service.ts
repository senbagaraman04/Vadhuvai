import { Injectable } from '@angular/core';
import { PaymentMethod, PaymentReceipt } from '@vadhuvai/shared/util-models';
import { delay } from '../utils/async';

@Injectable({ providedIn: 'root' })
export class MockEpayService {
  async pay(amount: number, method: PaymentMethod): Promise<PaymentReceipt> {
    await delay(2000);
    return {
      transactionId: `EPAY-${Date.now().toString(36).toUpperCase()}`,
      amount,
      method,
      paidAt: new Date().toISOString(),
    };
  }
}
