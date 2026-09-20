import { afterEach, describe, expect, it } from 'vitest';
import { gsap } from 'gsap';
import { createToast } from '../src/index.js';
import { createGsapAnimationDriver } from '../src/animations/gsap.js';

const cleanups: Array<() => void> = [];

function setup(position: 'top-end' | 'bottom-end' = 'bottom-end') {
  const root = document.createElement('div');
  root.dataset.a11yToast = '';
  document.body.append(root);
  const toast = createToast(root, { animation: 'none', position });
  const id = toast.show({ message: 'Probe', persistent: true })!;
  const element = root.querySelector<HTMLElement>('[data-a11y-toast-id]')!;
  const snapshot = toast.getToast(id)!;
  cleanups.push(() => {
    toast.destroy();
    root.remove();
  });
  return { root, toast, id, element, snapshot };
}

function context(
  setupResult: ReturnType<typeof setup>,
  phase: 'enter' | 'exit',
  signal: AbortSignal,
) {
  return Object.freeze({
    instance: setupResult.toast,
    root: setupResult.root,
    element: setupResult.element,
    toast: setupResult.snapshot,
    phase,
    signal,
  });
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

describe('GSAP toast animation driver', () => {
  it('accepts the real GSAP 3 package and removes inline styles after entrance', async () => {
    const fixture = setup();
    const driver = createGsapAnimationDriver(gsap, { enterDuration: 0.01, distance: 6 });
    const before = fixture.element.getAttribute('style');
    await driver.enter!(context(fixture, 'enter', new AbortController().signal));
    expect(fixture.element.getAttribute('style')).toBe(before);
  });

  it('removes inline styles after exit completion', async () => {
    const fixture = setup();
    const driver = createGsapAnimationDriver(gsap, { exitDuration: 0.01, distance: 6 });
    const before = fixture.element.getAttribute('style');
    await driver.exit!(context(fixture, 'exit', new AbortController().signal));
    expect(fixture.element.getAttribute('style')).toBe(before);
  });

  it('reverts and rejects with AbortError when the core signal aborts', async () => {
    const fixture = setup();
    const driver = createGsapAnimationDriver(gsap, { enterDuration: 1 });
    const controller = new AbortController();
    const before = fixture.element.getAttribute('style');
    const pending = driver.enter!(context(fixture, 'enter', controller.signal));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fixture.element.getAttribute('style')).toBe(before);
  });

  it('reports external GSAP interruption while still reverting inline styles', async () => {
    const fixture = setup();
    const driver = createGsapAnimationDriver(gsap, { enterDuration: 1 });
    const before = fixture.element.getAttribute('style');
    const pending = driver.enter!(context(fixture, 'enter', new AbortController().signal));
    gsap.killTweensOf(fixture.element);
    await expect(pending).rejects.toThrow('interrupted before completion');
    expect(fixture.element.getAttribute('style')).toBe(before);
  });

  it('rejects malformed GSAP objects and invalid driver options before animation', () => {
    expect(() => createGsapAnimationDriver({} as never)).toThrow(/fromTo/);
    expect(() => createGsapAnimationDriver(gsap, { enterDuration: -1 })).toThrow(/enterDuration/);
    expect(() => createGsapAnimationDriver(gsap, { exitEase: '   ' })).toThrow(/exitEase/);
  });
});
