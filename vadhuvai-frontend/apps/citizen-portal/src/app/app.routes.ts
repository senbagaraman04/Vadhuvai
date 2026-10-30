import { Routes } from '@angular/router';
import { citizenSessionGuard } from './guards/citizen-session.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth' },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth').then((m) => m.AuthPage),
  },
  {
    path: 'application',
    canActivate: [citizenSessionGuard],
    loadComponent: () => import('./pages/application/application').then((m) => m.ApplicationPage),
  },
  {
    path: 'documents',
    canActivate: [citizenSessionGuard],
    loadComponent: () => import('./pages/documents/documents').then((m) => m.DocumentsPage),
  },
  {
    path: 'payment',
    canActivate: [citizenSessionGuard],
    loadComponent: () => import('./pages/payment/payment').then((m) => m.PaymentPage),
  },
  {
    path: 'status',
    canActivate: [citizenSessionGuard],
    loadComponent: () => import('./pages/status/status').then((m) => m.StatusPage),
  },
];
