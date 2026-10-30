import { PaymentMethod } from '@vadhuvai/shared/util-models';

export interface FeeLine {
  label: string;
  /** Amount in rupees. Zero means the fee does not apply and is shown as not applicable. */
  amount: number;
}

export const FEE_BREAKUP: readonly FeeLine[] = [
  { label: 'Statutory registration fee', amount: 500 },
  { label: 'Stamp duty fee', amount: 0 },
  { label: 'Portal service charge', amount: 50 },
];

export const FEE_TOTAL = FEE_BREAKUP.reduce(
  (sum, line) => sum + line.amount,
  0,
);

export interface PaymentOption {
  value: PaymentMethod;
  label: string;
  detail: string;
}

export const PAYMENT_OPTIONS: readonly PaymentOption[] = [
  { value: 'UPI', label: 'UPI', detail: 'GPay, PhonePe or any UPI app' },
  { value: 'NET_BANKING', label: 'Net banking', detail: 'All major banks' },
  {
    value: 'CARD',
    label: 'Credit / debit card',
    detail: 'Visa, Mastercard or RuPay',
  },
];
