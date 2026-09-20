import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAriaNotifyTransport } from '../src/transports/aria-notify.js';

const original = Object.getOwnPropertyDescriptor(document, 'ariaNotify');

afterEach(() => {
  if (original) Object.defineProperty(document, 'ariaNotify', original);
  else delete (document as Document & { ariaNotify?: unknown }).ariaNotify;
});

describe('experimental ariaNotify transport', () => {
  it('maps polite to normal without touching the live region', () => {
    const notify = vi.fn();
    Object.defineProperty(document, 'ariaNotify', { configurable: true, value: notify });
    const region = document.createElement('div');
    const transport = createAriaNotifyTransport();
    const result = transport.announce({ message: 'Saved', priority: 'polite', liveRegion: region });
    expect(notify).toHaveBeenCalledWith('Saved', { priority: 'normal' });
    expect(region.textContent).toBe('');
    expect(result).toEqual({ transport: 'aria-notify', fallback: false });
  });

  it('maps assertive to high', () => {
    const notify = vi.fn();
    Object.defineProperty(document, 'ariaNotify', { configurable: true, value: notify });
    const region = document.createElement('div');
    const transport = createAriaNotifyTransport();
    transport.announce({ message: 'Urgent', priority: 'assertive', liveRegion: region });
    expect(notify).toHaveBeenCalledWith('Urgent', { priority: 'high' });
  });

  it('falls back to the scheduled live region when ariaNotify is unsupported', () => {
    Object.defineProperty(document, 'ariaNotify', { configurable: true, value: undefined });
    const region = document.createElement('div');
    const transport = createAriaNotifyTransport();
    const result = transport.announce({ message: 'Fallback', priority: 'polite', liveRegion: region });
    expect(region.textContent).toBe('Fallback');
    expect(result).toEqual({ transport: 'live-region', fallback: true });
  });

  it('is explicit, frozen and named as experimental transport boundary', () => {
    const transport = createAriaNotifyTransport();
    expect(transport.name).toBe('aria-notify');
    expect(Object.isFrozen(transport)).toBe(true);
  });
});
