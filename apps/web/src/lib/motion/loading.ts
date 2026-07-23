/**
 * Three-Phase Loading coordinator: structure -> progress -> release. The caller
 * renders the final region dimensions immediately (structure). This helper
 * flips a single progress cue, then releases to the destination's own entry
 * motion. Interactions expected under 400ms should skip this entirely.
 */

export type LoadingPhase = 'structure' | 'progress' | 'release';

export interface LoadingSurfaceOptions {
  /** Minimum time the progress cue stays visible to avoid flicker. */
  minProgressMs?: number;
}

export class LoadingSurface {
  private el: HTMLElement;
  private minProgressMs: number;
  private progressStartedAt = 0;

  constructor(el: HTMLElement, options: LoadingSurfaceOptions = {}) {
    this.el = el;
    this.minProgressMs = options.minProgressMs ?? 300;
    this.setPhase('structure');
  }

  private setPhase(phase: LoadingPhase) {
    this.el.dataset.loadingPhase = phase;
  }

  progress() {
    this.progressStartedAt = performance.now();
    this.setPhase('progress');
  }

  async release() {
    const elapsed = performance.now() - this.progressStartedAt;
    const wait = Math.max(0, this.minProgressMs - elapsed);
    if (wait > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, wait));
    }
    this.setPhase('release');
  }
}
