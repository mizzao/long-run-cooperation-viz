import Lenis from 'lenis';
import { prefersReducedMotion } from './progress';

export function initLenis(): () => void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return () => {};
  if (window.matchMedia('(pointer: coarse)').matches) return () => {};
  const lenis = new Lenis({ duration: 1.1 });
  let raf = 0;
  const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); lenis.destroy(); };
}
