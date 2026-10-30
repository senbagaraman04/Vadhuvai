import { bootstrapApplication } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter([
      { path: 'sro', children: routes },
      { path: '', pathMatch: 'full', redirectTo: 'sro' },
      { path: '**', redirectTo: 'sro' },
    ]),
  ],
}).catch((error: unknown) => console.error(error));