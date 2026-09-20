import type { ToastId, ToastPriority } from './types.js';

type Priority = Exclude<ToastPriority, 'off'>;
interface Entry {
  id: ToastId;
  message: string;
  valid: () => boolean;
  committed: () => void;
}
interface Channel {
  region: HTMLElement;
  pending: Map<ToastId, Entry>;
  timer: number | null;
  stage: 'idle' | 'write' | 'gap';
}
/** Schedules DOM writes, not speech. Browsers expose no live-region speech-complete event. */
export class LiveAnnouncer {
  private readonly channels: Record<Priority, Channel>;
  private paused = false;
  private destroyed = false;

  constructor(private readonly win: Window, polite: HTMLElement, assertive: HTMLElement) {
    this.channels = {
      polite: { region: polite, pending: new Map(), timer: null, stage: 'idle' },
      assertive: { region: assertive, pending: new Map(), timer: null, stage: 'idle' },
    };
  }
  request(priority: ToastPriority, entry: Entry): void {
    if (this.destroyed) return;
    // Only one pending announcement per toast; an update replaces rather than appends it.
    for (const p of ['polite', 'assertive'] as const) {
      if (p !== priority) this.cancelFrom(this.channels[p], entry.id);
    }
    if (priority === 'off') return;
    const channel = this.channels[priority];
    channel.pending.set(entry.id, entry);
    this.pump(channel);
  }
  cancel(id: ToastId): void {
    this.cancelFrom(this.channels.polite, id);
    this.cancelFrom(this.channels.assertive, id);
  }
  setPaused(paused: boolean): void {
    if (this.destroyed || paused === this.paused) return;
    this.paused = paused;
    for (const channel of Object.values(this.channels)) {
      if (paused) this.stop(channel);
      else this.pump(channel);
    }
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const channel of Object.values(this.channels)) {
      this.stop(channel);
      channel.pending.clear();
      channel.region.textContent = '';
    }
  }
  private cancelFrom(channel: Channel, id: ToastId): void {
    channel.pending.delete(id);
    if (channel.pending.size === 0 && channel.stage === 'write') this.stop(channel);
  }
  private stop(channel: Channel): void {
    if (channel.timer !== null) this.win.clearTimeout(channel.timer);
    channel.timer = null;
    channel.stage = 'idle';
  }
  private pump(channel: Channel): void {
    if (this.destroyed || this.paused || channel.timer !== null || channel.pending.size === 0) return;
    channel.region.textContent = '';
    channel.stage = 'write';
    channel.timer = this.win.setTimeout(() => {
      channel.timer = null;
      channel.stage = 'idle';
      if (this.destroyed || this.paused) return;
      let entry: Entry | undefined;
      for (const [id, candidate] of channel.pending) {
        channel.pending.delete(id);
        if (candidate.valid()) { entry = candidate; break; }
      }
      if (!entry) return;
      channel.region.textContent = entry.message;
      channel.stage = 'gap';
      // Register the next scheduling boundary before invoking application code.
      channel.timer = this.win.setTimeout(() => {
        channel.timer = null;
        channel.stage = 'idle';
        this.pump(channel);
      }, 1000);
      entry.committed();
    }, 100);
  }
}
