import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VadhuvaiStepper } from '@vadhuvai/shared/ui';
import { PaymentMethod } from '@vadhuvai/shared/util-models';
import { CITIZEN_STEPS } from '../../data/citizen-steps';
import {
  FEE_BREAKUP,
  FEE_TOTAL,
  PAYMENT_OPTIONS,
} from '../../data/payment-config';
import { ApplicationStore } from '../../services/application-store.service';

@Component({
  selector: 'app-payment-page',
  imports: [CurrencyPipe, RouterLink, VadhuvaiStepper],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly store = inject(ApplicationStore);

  protected readonly steps = CITIZEN_STEPS;
  protected readonly feeBreakup = FEE_BREAKUP;
  protected readonly feeTotal = FEE_TOTAL;
  protected readonly options = PAYMENT_OPTIONS;
  protected readonly selectedMethod = signal<PaymentMethod>('UPI');
  protected readonly processing = signal(false);

  ngOnInit(): void {
    if (this.store.appointment()) {
      void this.router.navigateByUrl('/citizen/status');
      return;
    }
    if (!this.store.canProceedToPayment()) {
      void this.router.navigateByUrl('/citizen/documents');
      return;
    }
    this.store.startPayment();
  }

  protected async pay(): Promise<void> {
    if (this.processing()) {
      return;
    }
    this.processing.set(true);
    try {
      await this.store.completePayment(this.selectedMethod());
      await this.router.navigateByUrl('/citizen/status');
    } finally {
      this.processing.set(false);
    }
  }
}
