import { provideHttpClient } from '@angular/common/http';
import { Routes } from '@angular/router';
import { SroApiService } from './sro-api.service';
import { SroLayoutComponent } from './sro-layout.component';

export const routes: Routes = [{
  path: '',
  component: SroLayoutComponent,
  providers: [provideHttpClient(), SroApiService],
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'queue' },
    { path: 'queue', loadComponent: () => import('./sro-queue.component').then((module) => module.SroQueueComponent) },
    { path: 'review/:id', loadComponent: () => import('./sro-review.component').then((module) => module.SroReviewComponent) },
    { path: '**', redirectTo: 'queue' },
  ],
}];