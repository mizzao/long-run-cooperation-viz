export function beat(p: number, start: number, end: number): number {
  if (end <= start) return p >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function windowEnv(p: number, at: number, until: number, ramp = 0.04): number {
  const rise = beat(p, at, at + ramp);
  const fall = until >= 1 ? 1 : 1 - beat(p, until - ramp, until);
  return Math.min(rise, fall);
}
