import { describe, expect, it } from 'vitest';
import * as api from '../src/index.js';
import { createProgressAddon } from '../src/addons/progress.js';
import { trackToastPromise } from '../src/addons/promise.js';
import { createDedupeController } from '../src/addons/dedupe.js';
import { createDomEventAdapter } from '../src/adapters/dom-events.js';
import { createAriaNotifyTransport } from '../src/transports/aria-notify.js';
import { createGsapAnimationDriver } from '../src/animations/gsap.js';
import { createGsapFlipLayoutAddon } from '../src/animations/gsap-flip.js';
// Shared browser-first contract. Layout-specific cases are deliberately skipped in jsdom.
// @ts-expect-error The JS harness is also loaded directly by browsers.
import { runSuite } from './browser/suite.js';
describe('a11y-toast shared behavioral contract', () => {
  it('passes all non-layout scenarios in the DOM environment', async () => {
    const results: Array<{ name: string; status: string; error?: string }> = await runSuite({ ...api, createProgressAddon, trackToastPromise, createDedupeController, createDomEventAdapter, createAriaNotifyTransport, createGsapAnimationDriver, createGsapFlipLayoutAddon }, { layout: false });
    expect(results.filter(row => row.status === 'fail')).toEqual([]);
    expect(results.filter(row => row.status === 'pass').length).toBeGreaterThan(50);
  }, 30000);
});
