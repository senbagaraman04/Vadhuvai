import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, switchMap, tap, throwError } from 'rxjs';
import { SroDecision, SroQueue, SroReview } from './sro.models';

@Injectable()
export class SroApiService {
  private readonly http = inject(HttpClient);
  private authorization = '';
  private csrfToken = '';
  readonly signedIn = signal(false);
  readonly officerName = signal('');

  signIn(username: string, password: string) {
    this.authorization = `Basic ${btoa(Array.from(new TextEncoder().encode(`${username}:${password}`),
      (byte) => String.fromCharCode(byte)).join(''))}`;
    return this.http.get<{ token: string }>('/api/v1/citizen/auth/csrf', this.options()).pipe(
      tap((response) => { this.csrfToken = response.token; }),
      switchMap(() => this.queue()),
      tap(() => { this.officerName.set(username); this.signedIn.set(true); }),
      map(() => undefined),
      catchError((error: unknown) => { this.signOut(); return throwError(() => error); }),
    );
  }

  signOut() {
    this.authorization = '';
    this.csrfToken = '';
    this.signedIn.set(false);
    this.officerName.set('');
  }

  queue(page = 0) {
    return this.http.get<SroQueue>(`/api/v1/sro/queue?page=${page}&size=25`, this.options());
  }

  review(id: string) {
    return this.http.get<SroReview>(`/api/v1/sro/${encodeURIComponent(id)}/review`, this.options());
  }

  decide(id: string, decision: SroDecision) {
    return this.http.post<SroReview>(`/api/v1/sro/${encodeURIComponent(id)}/decision`, decision, this.options());
  }

  document(url: string) {
    const parsed = new URL(url, location.origin);
    if (parsed.origin !== location.origin || !parsed.pathname.startsWith('/api/v1/sro/')) {
      return throwError(() => new Error('Document URL is not an officer API resource'));
    }
    return this.http.get(parsed.pathname + parsed.search, { ...this.options(), responseType: 'blob' });
  }

  private options() {
    let headers = new HttpHeaders({ Authorization: this.authorization });
    if (this.csrfToken) headers = headers.set('X-CSRF-TOKEN', this.csrfToken);
    return { headers, withCredentials: true };
  }
}

export function sroError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'Your session has expired. Sign out and sign in again.';
    if (error.status === 403) return 'Officer access was denied or the security token expired. Sign in again.';
    if (error.status === 404) return 'This application could not be found.';
    if (error.status === 0) return 'The registration service is unavailable. Please try again.';
    if (error.status === 400 && typeof error.error?.message === 'string') return error.error.message;
  }
  return 'The request could not be completed. Please try again.';
}