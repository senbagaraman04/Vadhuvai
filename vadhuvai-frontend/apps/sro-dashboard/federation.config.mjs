import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'sro-dashboard',
  exposes: { './Routes': './apps/sro-dashboard/src/app/app.routes.ts' },
  shared: {
    ...shareAll(
      { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' },
      { overrides: { '@angular/core': {
        singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package',
        includeSecondaries: { keepAll: true },
      } } },
    ),
  },
  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],
  features: { denseChunking: true },
});