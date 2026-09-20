import { afterEach, describe, expect, it } from 'vitest';
import {
  MENU_BUTTON_EVENTS,
  createMenuButton,
  type AsyncMenuStateEventDetail,
} from 'a11y-menu-button/core';
import { enhanceAsyncMenuState } from 'a11y-menu-button/addons/async-menu-state';
import { createToast } from '../src/index.js';
import { createMenuButtonAsyncStateToastAdapter } from '../src/adapters/menu-button-async-state.js';

const cleanups: Array<() => void> = [];

function setup(initial: 'loading' | 'ready' = 'ready') {
  const menuRoot = document.createElement('div');
  menuRoot.dataset.a11yMenuButton = '';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.setAttribute('aria-controls', 'menu-panel');
  trigger.textContent = 'Actions';
  const panel = document.createElement('div');
  panel.id = 'menu-panel';
  panel.className = 'a11y-menu-button__panel';
  panel.hidden = false;
  menuRoot.append(trigger, panel);

  const toastRoot = document.createElement('div');
  toastRoot.dataset.a11yToast = '';
  document.body.append(menuRoot, toastRoot);

  const menu = createMenuButton(menuRoot, { observeVisibility: false });
  const toast = createToast(toastRoot, { animation: 'none' });
  const adapter = createMenuButtonAsyncStateToastAdapter(toast, menuRoot);
  const asyncState = enhanceAsyncMenuState(menuRoot, {
    state: initial,
    message: initial === 'loading' ? 'Loading actions…' : undefined,
  });

  cleanups.push(() => {
    adapter.destroy();
    asyncState.destroy();
    menu.destroy();
    toast.destroy();
    menuRoot.remove();
    toastRoot.remove();
  });

  return { menuRoot, menu, toast, adapter, asyncState };
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

describe('A11y Menu Button async-state toast adapter', () => {
  it('mirrors loading from the actual async-state event while Menu Button owns speech', () => {
    const { toast } = setup('loading');
    const [record] = toast.getToasts();
    expect(record?.message).toBe('Loading actions…');
    expect(record?.tone).toBe('loading');
    expect(record?.priority).toBe('off');
    expect(record?.persistent).toBe(true);
  });

  it('updates one retained toast through error and empty states, then dismisses on ready', () => {
    const { toast, asyncState } = setup('loading');
    const id = toast.getToasts()[0]?.id;
    asyncState.setError({ message: 'Actions could not be loaded.' });
    expect(toast.getToasts()).toHaveLength(1);
    expect(toast.getToast(id!)?.message).toBe('Actions could not be loaded.');
    expect(toast.getToast(id!)?.tone).toBe('error');
    expect(toast.getToast(id!)?.priority).toBe('off');

    asyncState.setEmpty({ message: 'No actions are available.' });
    expect(toast.getToast(id!)?.message).toBe('No actions are available.');
    expect(toast.getToast(id!)?.tone).toBe('info');

    asyncState.setReady();
    expect(toast.getToasts()).toEqual([]);
  });

  it('uses the source status text rather than private async-state implementation fields', () => {
    const { toast, asyncState } = setup();
    asyncState.setError({ message: 'Friendly source-owned message.' });
    expect(toast.getToasts()[0]?.message).toBe('Friendly source-owned message.');
  });

  it('source menu destruction disposes the adapter and dismisses its mirrored toast', () => {
    const { toast, menu, adapter } = setup('loading');
    expect(toast.getToasts()).toHaveLength(1);
    menu.destroy();
    expect(adapter.isDestroyed).toBe(true);
    expect(toast.getToasts()).toEqual([]);
  });

  it('toast destruction disposes the underlying DOM adapter and ignores later source states', () => {
    const { toast, adapter, asyncState } = setup();
    toast.destroy();
    expect(adapter.isDestroyed).toBe(true);
    asyncState.setError({ message: 'Late source state.' });
    expect(toast.getToasts()).toEqual([]);
  });

  it('ignores async-state events for a different root even when they bubble through the source root', () => {
    const { menuRoot, toast } = setup();
    const foreignRoot = document.createElement('div');
    const panel = document.createElement('div');
    const stateElement = document.createElement('div');
    stateElement.textContent = 'Foreign state';
    const fakeController = {
      panel,
      stateElement,
      setState() {},
      setLoading() {},
      setEmpty() {},
      setError() {},
      setReady() {},
      destroy() {},
    };
    const detail: AsyncMenuStateEventDetail = {
      root: foreignRoot,
      state: 'error',
      previousState: 'loading',
      loading: false,
      panel,
      stateElement,
      controller: fakeController,
      reason: 'programmatic',
    };
    menuRoot.dispatchEvent(new CustomEvent(MENU_BUTTON_EVENTS.asyncState, { bubbles: true, detail }));
    expect(toast.getToasts()).toEqual([]);
  });
});
