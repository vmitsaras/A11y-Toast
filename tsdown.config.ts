import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: { index: './src/index.ts', docs: './src/docs.ts', 'addons/progress': './src/addons/progress.ts', 'addons/promise': './src/addons/promise.ts', 'addons/dedupe': './src/addons/dedupe.ts', 'adapters/dom-events': './src/adapters/dom-events.ts', 'adapters/menu-button-async-state': './src/adapters/menu-button-async-state.ts', 'transports/aria-notify': './src/transports/aria-notify.ts', 'animations/gsap': './src/animations/gsap.ts', 'animations/gsap-flip': './src/animations/gsap-flip.ts' },
  format: ['esm'], dts: true, clean: true, sourcemap: true,
  target: 'es2022', platform: 'neutral', outDir: 'dist',
});
