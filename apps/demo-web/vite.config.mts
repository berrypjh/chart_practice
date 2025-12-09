/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

const root = import.meta.dirname;

export default defineConfig(() => ({
  root,
  cacheDir: '../../node_modules/.vite/apps/demo-web',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@my-chart/core': path.resolve(
        root,
        '../../libs/chart-core/src/index.ts'
      ),
      '@my-chart/react': path.resolve(
        root,
        '../../libs/chart-react/src/index.ts'
      ),
      '@my-chart/shared-data': path.resolve(root, '../../shared/src/index.ts'),
    },
  },
  build: {
    outDir: path.join(root, './dist'),
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: '@my-chart-lib/demo-web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: path.join(root, './test-output/vitest/coverage'),
      provider: 'v8' as const,
    },
  },
}));
