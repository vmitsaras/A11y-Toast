import { afterEach, describe, expect, it } from 'vitest';
import { createToast } from '../src/index.js';
import { createElementViewTransitionDriver } from '../src/animations/view-transition.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function installFakeStartViewTransition(
  implementation: (this: HTMLElement, callback?: () => void | Promise<void>) => {
    finished: Promise<unknown>;
    skipTransition(): void;
    transitionRoot?: Element;
  },
): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'startViewTransition');
  Object.defineProperty(HTMLElement.prototype, 'startViewTransition', {
    configurable: true,
    writable: true,
    value: implementation,
  });
  return () => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'startViewTransition', descriptor);
    else delete (Element.prototype as Element & { startViewTransition?: unknown }).startViewTransition;
  };
}

describe('experimental element-scoped View Transition driver', () => {
  it('uses the toast element as scope and restores exact authored style/phase after entrance', async () => {
    let transitionRoot: Element | null = null;
    const remove = installFakeStartViewTransition(function (callback) {
      transitionRoot = this;
      callback?.();
      return { finished: Promise.resolve(), skipTransition() {}, transitionRoot: this };
    });
    cleanups.push(remove);

    const root = document.createElement('div');
    root.dataset.a11yToast = '';
    document.body.append(root);
    const toast = createToast(root, { animation: 'none' });
    const id = toast.show({ message: 'Probe', persistent: true })!;
    const element = root.querySelector<HTMLElement>('[data-a11y-toast-id]')!;
    element.setAttribute('style', 'outline-width: 2px;');
    element.setAttribute('data-a11y-toast-view-transition-phase', 'authored');
    const snapshot = toast.getToast(id)!;
    const driver = createElementViewTransitionDriver();

    await driver.enter!({
      instance: toast,
      root,
      element,
      toast: snapshot,
      phase: 'enter',
      signal: new AbortController().signal,
    });

    expect(transitionRoot).toBe(element);
    expect(element.getAttribute('style')).toBe('outline-width: 2px;');
    expect(element.hasAttribute('data-a11y-toast-view-transition-state')).toBe(false);
    expect(element.hasAttribute('data-a11y-toast-view-transition-direction')).toBe(false);
    expect(element.getAttribute('data-a11y-toast-view-transition-phase')).toBe('authored');

    cleanups.push(() => { toast.destroy(); root.remove(); });
  });

  it('settles immediately when Element.startViewTransition is unavailable', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'startViewTransition');
    delete (Element.prototype as Element & { startViewTransition?: unknown }).startViewTransition;
    cleanups.push(() => {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, 'startViewTransition', descriptor);
    });

    const root = document.createElement('div');
    root.dataset.a11yToast = '';
    document.body.append(root);
    const toast = createToast(root, { animation: 'none' });
    const id = toast.show({ message: 'Fallback', persistent: true })!;
    const element = root.querySelector<HTMLElement>('[data-a11y-toast-id]')!;
    const driver = createElementViewTransitionDriver();

    await expect(driver.exit!({
      instance: toast,
      root,
      element,
      toast: toast.getToast(id)!,
      phase: 'exit',
      signal: new AbortController().signal,
    })).resolves.toBeUndefined();

    cleanups.push(() => { toast.destroy(); root.remove(); });
  });

  it('calls skipTransition on abort and restores element state after finished settles', async () => {
    let resolveFinished!: () => void;
    let skips = 0;
    const remove = installFakeStartViewTransition(function (callback) {
      callback?.();
      return {
        finished: new Promise<void>(resolve => { resolveFinished = resolve; }),
        skipTransition() { skips++; },
        transitionRoot: this,
      };
    });
    cleanups.push(remove);

    const root = document.createElement('div');
    root.dataset.a11yToast = '';
    document.body.append(root);
    const toast = createToast(root, { animation: 'none' });
    const id = toast.show({ message: 'Abort', persistent: true })!;
    const element = root.querySelector<HTMLElement>('[data-a11y-toast-id]')!;
    const controller = new AbortController();
    const driver = createElementViewTransitionDriver();
    const pending = driver.exit!({
      instance: toast,
      root,
      element,
      toast: toast.getToast(id)!,
      phase: 'exit',
      signal: controller.signal,
    });

    controller.abort();
    expect(skips).toBe(1);
    resolveFinished();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(element.hasAttribute('style')).toBe(false);
    expect(element.hasAttribute('data-a11y-toast-view-transition-phase')).toBe(false);
    expect(element.hasAttribute('data-a11y-toast-view-transition-state')).toBe(false);
    expect(element.hasAttribute('data-a11y-toast-view-transition-direction')).toBe(false);

    cleanups.push(() => { toast.destroy(); root.remove(); });
  });

  it('never calls document.startViewTransition as an unsupported fallback', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'startViewTransition');
    delete (Element.prototype as Element & { startViewTransition?: unknown }).startViewTransition;
    const documentTransition = (document as Document & { startViewTransition?: unknown }).startViewTransition;
    const marker = () => { throw new Error('document-scoped transition must not run'); };
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: marker });
    cleanups.push(() => {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, 'startViewTransition', descriptor);
      if (documentTransition === undefined) delete (document as Document & { startViewTransition?: unknown }).startViewTransition;
      else Object.defineProperty(document, 'startViewTransition', { configurable: true, value: documentTransition });
    });

    const root = document.createElement('div');
    root.dataset.a11yToast = '';
    document.body.append(root);
    const toast = createToast(root, { animation: createElementViewTransitionDriver() });
    expect(() => toast.show({ message: 'No document fallback', persistent: true })).not.toThrow();

    cleanups.push(() => { toast.destroy(); root.remove(); });
  });
});
