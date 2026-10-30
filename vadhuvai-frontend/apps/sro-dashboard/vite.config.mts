import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/sro-dashboard',
  plugins: [angular(), nxViteTsPaths()],
  test: {
    name: 'sro-dashboard', watch: false, globals: true, environment: 'jsdom',
    include: ['src/**/*.spec.ts'], setupFiles: ['src/test-setup.ts'], reporters: ['default'],
  },
});