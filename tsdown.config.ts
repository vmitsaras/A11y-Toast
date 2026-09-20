import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: { index: './src/index.ts', docs: './src/docs.ts', 'addons/progress': './src/addons/progress.ts', 'addons/promise': './src/addons/promise.ts', 'addons/dedupe': './src/addons/dedupe.ts' },
  format: ['esm'], dts: true, clean: true, sourcemap: true,
  target: 'es2022', platform: 'neutral', outDir: 'dist',
});
