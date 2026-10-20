import { loadRemoteModule } from '@angular-architects/native-federation';
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./landing').then((module) => module.Landing),
	},
{
    path: 'citizen',
    loadChildren: () =>
      loadRemoteModule('citizen-portal', './Routes').then((m) => m.routes),
  },
];
