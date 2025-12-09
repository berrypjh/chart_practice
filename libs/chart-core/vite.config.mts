/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';

const root = import.meta.dirname;

export default defineConfig({
  root,
  cacheDir: '../../node_modules/.vite/libs/chart-core',
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(root, 'tsconfig.lib.json'),
    }),
  ],
  build: {
    outDir: path.join(root, './dist'),
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: path.join(root, 'src/index.ts'),
      name: '@my-chart/core',
      fileName: 'index',
      formats: ['es' as const],
    },
    rollupOptions: {
      external: [],
    },
  },
  test: {
    name: '@my-chart/core',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: path.join(root, './test-output/vitest/coverage'),
      provider: 'v8' as const,
    },
  },
});
