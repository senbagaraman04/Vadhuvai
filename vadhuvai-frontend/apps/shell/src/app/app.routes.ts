import { Route } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const appRoutes: Route[] = [
	{ path: '', pathMatch: 'full', redirectTo: 'citizen-portal' },
	{
		path: 'citizen-portal',
		loadChildren: () =>
			loadRemoteModule('citizen-portal', './Routes').then((module) => module.appRoutes),
	},
];
