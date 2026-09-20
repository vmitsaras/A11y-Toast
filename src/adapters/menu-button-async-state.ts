import {
  MENU_BUTTON_EVENTS,
  addMenuButtonEventListener,
  type AsyncMenuStateEventDetail,
  type MenuButtonCustomEvent,
} from 'a11y-menu-button/core';
import { createDomEventAdapter } from './dom-events.js';
import type { DomEventAdapter } from './dom-events.js';
import type { ToastInstance } from '../types.js';

const CORRELATION_KEY = 'a11y-menu-button:async-state';

export interface MenuButtonAsyncStateToastAdapter {
  readonly instance: ToastInstance;
  readonly sourceRoot: HTMLElement;
  readonly announcementOwner: 'source';
  readonly isDestroyed: boolean;
  destroy(): void;
}

function stateMessage(detail: AsyncMenuStateEventDetail): string {
  return (detail.stateElement.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function createMenuButtonAsyncStateToastAdapter(
  instance: ToastInstance,
  sourceRoot: HTMLElement,
): MenuButtonAsyncStateToastAdapter {
  if (!(sourceRoot instanceof HTMLElement)) {
    throw new TypeError('Menu Button async-state toast adapter requires an HTMLElement source root.');
  }

  let destroyed = false;
  let domAdapter: DomEventAdapter;

  domAdapter = createDomEventAdapter(instance, {
    target: sourceRoot,
    announcementOwner: 'source',
    dismissTrackedOnDestroy: true,
    bindings: [{
      event: MENU_BUTTON_EVENTS.asyncState,
      map(event) {
        const detail = (event as MenuButtonCustomEvent<typeof MENU_BUTTON_EVENTS.asyncState>).detail;
        if (!detail || detail.root !== sourceRoot) return { type: 'ignore' };
        if (detail.state === 'ready') {
          return { type: 'dismiss', correlationKey: CORRELATION_KEY };
        }

        const message = stateMessage(detail);
        if (!message) return { type: 'dismiss', correlationKey: CORRELATION_KEY };

        if (detail.state === 'loading') {
          return {
            type: 'show',
            correlationKey: CORRELATION_KEY,
            input: {
              message,
              tone: 'loading',
              priority: 'off',
              persistent: true,
            },
          };
        }

        return {
          type: 'show',
          correlationKey: CORRELATION_KEY,
          input: {
            message,
            tone: detail.state === 'error' ? 'error' : 'info',
            priority: 'off',
            persistent: true,
          },
        };
      },
    }],
  });

  const removeSourceDestroy = addMenuButtonEventListener(
    sourceRoot,
    MENU_BUTTON_EVENTS.destroy,
    () => adapter.destroy(),
  );

  const adapter: MenuButtonAsyncStateToastAdapter = {
    instance,
    sourceRoot,
    announcementOwner: 'source',
    get isDestroyed() { return destroyed || domAdapter.isDestroyed; },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      removeSourceDestroy();
      domAdapter.destroy();
    },
  };

  return Object.freeze(adapter);
}
