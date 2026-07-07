import Lenis from 'lenis';
import { prefersReducedMotion } from './progress';

let instance: Lenis | null = null;

export function initLenis(): () => void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => {};
  if (window.matchMedia('(pointer: coarse)').matches) return () => {};
  const lenis = new Lenis({ duration: 1.1 });
  instance = lenis;
  let raf = 0;
  const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); lenis.destroy(); instance = null; };
}

export function scrollToY(y: number) {
  if (typeof window === 'undefined') return;
  if (instance) instance.scrollTo(y, { duration: 1.0 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}
