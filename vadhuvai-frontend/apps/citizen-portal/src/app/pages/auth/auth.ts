import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VadhuvaiStepper } from '@vadhuvai/shared/ui';
import { CITIZEN_STEPS } from '../../data/citizen-steps';
import {
  CitizenSession,
  MOCK_OTP,
} from '../../services/citizen-session.service';
import { formErrorOf } from '../../utils/form-validation';

const RESEND_SECONDS = 60;

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, VadhuvaiStepper],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly session = inject(CitizenSession);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly steps = CITIZEN_STEPS;
  protected readonly demoOtp = MOCK_OTP;
  protected readonly errorOf = formErrorOf;

  protected readonly phoneForm = this.fb.group({
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    acceptTerms: [false, Validators.requiredTrue],
  });

  protected readonly otpControl = this.fb.control('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/),
  ]);

  protected readonly otpSent = signal(false);
  protected readonly requesting = signal(false);
  protected readonly verifying = signal(false);
  protected readonly otpError = signal<string | null>(null);
  protected readonly resendIn = signal(0);

  private readonly otpInput =
    viewChild<ElementRef<HTMLInputElement>>('otpInput');
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.otpSent()) {
        this.otpInput()?.nativeElement.focus();
      }
    });
    this.destroyRef.onDestroy(() => this.stopResendTimer());
  }

  protected get maskedMobile(): string {
    const mobile =
      this.session.mobileNumber() || this.phoneForm.controls.mobileNumber.value;
    return `+91 ******${mobile.slice(-4)}`;
  }

  protected async requestOtp(): Promise<void> {
    if (this.resendIn() > 0 || this.requesting()) {
      return;
    }
    this.phoneForm.markAllAsTouched();
    if (this.phoneForm.invalid) {
      return;
    }
    this.requesting.set(true);
    await this.session.requestOtp(this.phoneForm.controls.mobileNumber.value);
    this.requesting.set(false);
    this.otpSent.set(true);
    this.otpControl.reset('');
    this.otpError.set(null);
    this.startResendTimer();
  }

  protected sanitizeOtp(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = digits;
    this.otpControl.setValue(digits);
  }

  protected async verifyOtp(): Promise<void> {
    this.otpControl.markAsTouched();
    if (this.otpControl.invalid || this.verifying()) {
      return;
    }
    this.verifying.set(true);
    const ok = await this.session.verifyOtp(this.otpControl.value);
    this.verifying.set(false);
    if (!ok) {
      this.otpError.set('Incorrect OTP. Please try again.');
      this.otpControl.reset('');
      return;
    }
    await this.router.navigateByUrl('/citizen/application');
  }

  protected changeNumber(): void {
    this.stopResendTimer();
    this.otpSent.set(false);
    this.otpError.set(null);
  }

  private startResendTimer(): void {
    this.stopResendTimer();
    this.resendIn.set(RESEND_SECONDS);
    this.timerId = setInterval(() => {
      const next = Math.max(this.resendIn() - 1, 0);
      this.resendIn.set(next);
      if (next === 0) {
        this.stopResendTimer();
      }
    }, 1000);
  }

  private stopResendTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
