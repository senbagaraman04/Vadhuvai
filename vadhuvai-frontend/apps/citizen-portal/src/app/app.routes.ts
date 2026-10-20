import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./portal-page').then((module) => module.PortalPage),
	}
	// {
	// 	path: '',
	// 	loadComponent: () => import('./auth').then((module) => module.AuthPage),
	// },
	// {
	// 	path: '',
	// 	loadComponent: () => import('./application').then((module) => module.ApplicationPage),
	// },
	// {
	// 	path: '',
	// 	loadComponent: () => import('./documents').then((module) => module.DocumentsPage),
	// },
	// {
	// 	path: '',
	// 	loadComponent: () => import('./payment').then((module) => module.PaymentPage),
	// },
	// {
	// 	path: '',
	// 	loadComponent: () => import('./status').then((module) => module.StatusPage),
	// }
];
