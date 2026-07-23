/**
 * Underline Draw (Text Link) and Surface Wipe (Contained Control) are expressed
 * in CSS on the MotionLink / MotionControl components so they survive without
 * JavaScript and remain active under reduced motion. This module only wires the
 * instant press-compression feedback that CSS `:active` cannot cover uniformly
 * across anchors and buttons.
 */

const PRESSED_CLASS = 'is-pressed';

export function initPressFeedback(root: ParentNode = document): () => void {
  const controls = [...root.querySelectorAll<HTMLElement>('[data-motion-control]')];

  const press = (event: Event) => {
    const el = event.currentTarget as HTMLElement;
    el.classList.add(PRESSED_CLASS);
  };
  const release = (event: Event) => {
    const el = event.currentTarget as HTMLElement;
    el.classList.remove(PRESSED_CLASS);
  };

  for (const control of controls) {
    control.addEventListener('pointerdown', press);
    control.addEventListener('pointerup', release);
    control.addEventListener('pointerleave', release);
    control.addEventListener('pointercancel', release);
    control.addEventListener('blur', release);
  }

  return () => {
    for (const control of controls) {
      control.removeEventListener('pointerdown', press);
      control.removeEventListener('pointerup', release);
      control.removeEventListener('pointerleave', release);
      control.removeEventListener('pointercancel', release);
      control.removeEventListener('blur', release);
    }
  };
}
