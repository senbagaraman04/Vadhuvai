import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./portal-page').then((module) => module.PortalPage),
	},
];
