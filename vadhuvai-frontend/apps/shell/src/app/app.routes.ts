import { Route } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const appRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./landing').then((module) => module.Landing),
	},
	{
		path: 'citizen-portal',
		loadChildren: () =>
			loadRemoteModule('citizen-portal', './Routes').then((module) => module.appRoutes),
	},
];
