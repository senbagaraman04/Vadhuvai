export type PaymentMethod = 'UPI' | 'NET_BANKING' | 'CARD';

export interface PaymentReceipt {
  transactionId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
}
