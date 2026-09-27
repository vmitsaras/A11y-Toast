import { TOAST_EVENTS } from '../events.js';
import type { ToastAddon, ToastAddonContext, ToastCleanup } from '../types.js';

const ITEM = '[data-a11y-toast-id]';
const CONTROL = 'button, a, input, select, textarea, [contenteditable], [data-a11y-toast-action], [data-a11y-toast-dismiss]';
const ENABLED = 'data-a11y-toast-swipe-enabled';
const DRAGGING = 'data-a11y-toast-swiping';

interface Gesture {
  id: string;
  item: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  locked: boolean;
  distance: number;
  release: ToastCleanup | null;
  priorTranslate: string;
  priorDragging: string | null;
}

/** Optional horizontal swipe dismissal for visible, dismissible notifications. */
export function createSwipeDismissAddon(): ToastAddon {
  return {
    name: 'swipe-dismiss',
    setup(context: ToastAddonContext) {
      if (typeof context.instance.options.animation !== 'string') {
        throw new TypeError('Swipe dismissal supports the built-in css and none animation modes.');
      }
      const { root, instance } = context;
      const win = root.ownerDocument.defaultView;
      if (!win) return;
      let gesture: Gesture | null = null;
      const priorEnabled = root.getAttribute(ENABLED);
      root.setAttribute(ENABLED, '');

      const cancel = (): void => {
        const current = gesture;
        if (!current) return;
        gesture = null;
        current.item.style.translate = current.priorTranslate;
        if (current.priorDragging === null) current.item.removeAttribute(DRAGGING);
        else current.item.setAttribute(DRAGGING, current.priorDragging);
        current.release?.();
        if (current.locked && current.item.hasPointerCapture?.(current.pointerId)) {
          try { current.item.releasePointerCapture(current.pointerId); } catch { /* Capture may already have ended. */ }
        }
      };
      const onDown = (event: PointerEvent): void => {
        if (gesture) {
          if (event.pointerId !== gesture.pointerId) cancel();
          return;
        }
        if (!event.isPrimary || event.button !== 0 || !(event.target instanceof win.Element)) return;
        if (event.target.closest(CONTROL)) return;
        const item = event.target.closest<HTMLElement>(ITEM);
        if (!item || !root.contains(item) || item.closest('.a11y-toast-region') !== root) return;
        const id = item.getAttribute('data-a11y-toast-id');
        const toast = id && instance.getToast(id);
        if (!id || !toast || toast.state !== 'visible' || !toast.dismissible || toast.animationPhase) return;
        gesture = {
          id, item, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
          locked: false, distance: 0, release: null,
          priorTranslate: item.style.translate, priorDragging: item.getAttribute(DRAGGING),
        };
      };
      const onOtherDown = (event: PointerEvent): void => {
        if (gesture && event.pointerId !== gesture.pointerId) cancel();
      };
      const onMove = (event: PointerEvent): void => {
        const current = gesture;
        if (!current || event.pointerId !== current.pointerId) return;
        const dx = event.clientX - current.startX;
        const dy = event.clientY - current.startY;
        if (!current.locked) {
          if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) { cancel(); return; }
          if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
          const toast = instance.getToast(current.id);
          if (!toast || toast.state !== 'visible' || !toast.dismissible || toast.animationPhase) { cancel(); return; }
          current.locked = true;
          current.release = context.holdTimer(current.id);
          if (gesture !== current || !instance.getToast(current.id) || context.signal.aborted) { current.release(); cancel(); return; }
          current.item.setAttribute(DRAGGING, '');
          try { current.item.setPointerCapture(event.pointerId); } catch { /* Window listeners still track the gesture. */ }
        }
        event.preventDefault();
        current.distance = dx;
        current.item.style.translate = `${dx}px 0`;
      };
      const onUp = (event: PointerEvent): void => {
        const current = gesture;
        if (!current || event.pointerId !== current.pointerId) return;
        const distance = event.clientX - current.startX;
        const commit = current.locked && Math.abs(distance) >= Math.min(96, Math.max(48, current.item.getBoundingClientRect().width * 0.28));
        const id = current.id;
        cancel();
        if (commit && instance.getToast(id)?.dismissible) instance.dismiss(id, 'swipe');
      };
      const onCancel = (event: PointerEvent): void => {
        if (gesture?.pointerId === event.pointerId) cancel();
      };
      const removeDismiss = context.on(TOAST_EVENTS.dismiss, event => {
        if (gesture?.id === event.detail.toast.id) cancel();
      });
      root.addEventListener('pointerdown', onDown);
      win.addEventListener('pointerdown', onOtherDown);
      win.addEventListener('pointermove', onMove);
      win.addEventListener('pointerup', onUp);
      win.addEventListener('pointercancel', onCancel);
      root.addEventListener('lostpointercapture', onCancel);
      win.addEventListener('blur', cancel);
      return () => {
        cancel();
        removeDismiss();
        if (priorEnabled === null) root.removeAttribute(ENABLED);
        else root.setAttribute(ENABLED, priorEnabled);
        root.removeEventListener('pointerdown', onDown);
        win.removeEventListener('pointerdown', onOtherDown);
        win.removeEventListener('pointermove', onMove);
        win.removeEventListener('pointerup', onUp);
        win.removeEventListener('pointercancel', onCancel);
        root.removeEventListener('lostpointercapture', onCancel);
        win.removeEventListener('blur', cancel);
      };
    },
  };
}
