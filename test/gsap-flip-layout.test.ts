import { afterEach, describe, expect, it } from 'vitest';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { createToast } from '../src/index.js';
import { createGsapFlipLayoutAddon } from '../src/animations/gsap-flip.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

describe('GSAP Flip layout add-on', () => {
  it('accepts the real GSAP/Flip package and does not leak Flip/style attributes after a layout pass', async () => {
    const root = document.createElement('div');
    root.dataset.a11yToast = '';
    document.body.append(root);
    const toast = createToast(root, {
      animation: 'none',
      addons: [createGsapFlipLayoutAddon(gsap, Flip, { duration: 0.01 })],
    });
    cleanups.push(() => { toast.destroy(); root.remove(); });

    toast.show({ message: 'A', persistent: true });
    toast.show({ message: 'B', persistent: true });
    await new Promise(resolve => setTimeout(resolve, 40));

    for (const element of root.querySelectorAll<HTMLElement>('[data-a11y-toast-id]')) {
      expect(element.hasAttribute('data-flip-id')).toBe(false);
      expect(element.hasAttribute('style')).toBe(false);
    }
  });

  it('preserves authored data-flip-id and inline styles after real Flip completes', async () => {
    const root = document.createElement('div');
    root.dataset.a11yToast = '';
    document.body.append(root);
    const toast = createToast(root, { animation: 'none' });
    const first = toast.show({ message: 'A', persistent: true })!;
    const element = root.querySelector<HTMLElement>(`[data-a11y-toast-id="${first}"]`)!;
    element.setAttribute('data-flip-id', 'authored');
    element.setAttribute('style', 'outline-width: 2px;');
    toast.registerAddon(createGsapFlipLayoutAddon(gsap, Flip, { duration: 0.01 }));
    cleanups.push(() => { toast.destroy(); root.remove(); });

    toast.show({ message: 'B', persistent: true });
    await new Promise(resolve => setTimeout(resolve, 40));

    expect(element.getAttribute('data-flip-id')).toBe('authored');
    expect(element.getAttribute('style')).toContain('outline-width');
  });

  it('validates injected GSAP/Flip contracts and options before registration', () => {
    expect(() => createGsapFlipLayoutAddon({} as never, Flip)).toThrow(/registerPlugin/);
    expect(() => createGsapFlipLayoutAddon(gsap, {} as never)).toThrow(/getState/);
    expect(() => createGsapFlipLayoutAddon(gsap, Flip, { duration: -1 })).toThrow(/duration/);
    expect(() => createGsapFlipLayoutAddon(gsap, Flip, { ease: '   ' })).toThrow(/ease/);
  });
});
