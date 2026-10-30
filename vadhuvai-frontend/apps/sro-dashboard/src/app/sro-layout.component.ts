import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { SroApiService } from './sro-api.service';

@Component({
  selector: 'app-sro-layout',
  imports: [ReactiveFormsModule, RouterOutlet, RouterLink],
  styleUrl: './sro.scss',
  template: `
    <section class="sro-workspace">
      <header class="sro-masthead d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div><p class="sro-eyebrow mb-1">VADHUVAI / SUB-REGISTRAR OFFICE</p><h1 class="h3 mb-0">Marriage Registration Review</h1></div>
        @if (api.signedIn()) {
          <div class="d-flex align-items-center gap-3"><span class="small text-secondary">{{ api.officerName() }}</span>
            <button type="button" class="btn btn-sm btn-outline-secondary" (click)="api.signOut()">Sign Out</button></div>
        }
      </header>
      @if (api.signedIn()) {
        <nav class="sro-nav" aria-label="Officer navigation"><a routerLink="/sro/queue">Pending Applications</a></nav>
        <router-outlet />
      } @else {
        <div class="sro-login">
          <h2 class="h4 mb-4">Officer Sign In</h2>
          @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
          <form [formGroup]="form" (ngSubmit)="signIn()">
            <label for="officer-username" class="form-label">Officer Username</label>
            <input id="officer-username" class="form-control mb-3" formControlName="username" autocomplete="username" />
            <label for="officer-password" class="form-label">Password</label>
            <input id="officer-password" type="password" class="form-control mb-4" formControlName="password" autocomplete="current-password" />
            <button class="btn btn-primary w-100" type="submit" [disabled]="form.invalid || busy()">{{ busy() ? 'Signing In...' : 'Sign In' }}</button>
          </form>
        </div>
      }
    </section>
  `,
})
export class SroLayoutComponent {
  readonly api = inject(SroApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(150), Validators.pattern(/^[^:]+$/)]],
    password: ['', Validators.required],
  });

  signIn() {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.api.signIn(username, password).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false)),
    ).subscribe({
      next: () => this.form.controls.password.reset(),
      error: () => { this.form.controls.password.reset(); this.error.set('Sign-in failed. Check your credentials and SRO officer access.'); },
    });
  }
}