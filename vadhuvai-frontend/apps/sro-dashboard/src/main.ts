import { initFederation } from '@angular-architects/native-federation';

initFederation({}, { hostRemoteEntry: { url: './remoteEntry.json' } })
  .then(() => import('./bootstrap'))
  .catch((error: unknown) => console.error(error));