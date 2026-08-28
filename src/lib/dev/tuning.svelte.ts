/**
 * Dev-only caption timing overrides.
 *
 * Sections read every caption window through `tune()` / `tw()` instead of
 * touching `cap.at` / `cap.until` directly. In dev the tuner panel can inject
 * overrides so the page re-renders live while you drag; in production `dev` is
 * a compile-time constant, so these collapse to a plain read of the source
 * values and the panel is never imported at all.
 */
import { browser, dev } from '$app/environment';

export interface CapWindow {
  readonly id?: string;
  readonly at: number;
  readonly until: number;
  /** Only read by the tuner panel, to show which caption a row belongs to. */
  readonly text?: string;
  readonly title?: string;
}

export interface SceneEntry {
  key: number;
  label: string;
  el: HTMLElement;
  captions: readonly CapWindow[];
}

const KEY = 'capTiming.overrides.v1';

const store = $state<{ overrides: Record<string, { at: number; until: number }> }>({ overrides: {} });

/** Every ScrollScene that carries captions, in document order. */
export const scenes = $state<SceneEntry[]>([]);

if (dev && browser) {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) store.overrides = JSON.parse(raw);
  } catch {
    /* corrupt or unavailable storage - start clean */
  }
}

function persist() {
  if (!dev || !browser) return;
  try {
    if (Object.keys(store.overrides).length) localStorage.setItem(KEY, JSON.stringify(store.overrides));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** The effective window for a caption: the override if one exists, else source. */
export function tune<T extends CapWindow>(cap: T): { at: number; until: number } {
  if (!dev) return cap;
  const o = cap.id ? store.overrides[cap.id] : undefined;
  return o ?? cap;
}

/** Spreadable form: `windowEnv(progress, ...tw(cap))`. */
export function tw(cap: CapWindow): [number, number] {
  const t = tune(cap);
  return [t.at, t.until];
}

export function setWindow(id: string, at: number, until: number) {
  store.overrides[id] = { at: r3(clamp01(at)), until: r3(clamp01(until)) };
  persist();
}

export function resetCap(id: string) {
  delete store.overrides[id];
  persist();
}

export function resetAll() {
  for (const k of Object.keys(store.overrides)) delete store.overrides[k];
  persist();
}

export function isTuned(id?: string): boolean {
  return !!(id && store.overrides[id]);
}

/** Overrides that actually differ from the source values, for save/export. */
export function changes(): { id: string; at: number; until: number }[] {
  const out: { id: string; at: number; until: number }[] = [];
  for (const s of scenes) {
    for (const c of s.captions) {
      const o = c.id && store.overrides[c.id];
      if (!c.id || !o) continue;
      if (r3(o.at) !== r3(c.at) || r3(o.until) !== r3(c.until)) out.push({ id: c.id, at: r3(o.at), until: r3(o.until) });
    }
  }
  return out;
}

/** Drop the persisted copy but keep the in-memory values (used around save). */
export function clearPersisted() {
  if (!browser) return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

let seq = 0;

/** Called by ScrollScene so the tuner knows which windows live where. */
export function registerScene(el: HTMLElement, captions: readonly CapWindow[] | undefined): () => void {
  if (!dev || !captions?.length) return () => {};
  const label = (captions.find((c) => c.id)?.id ?? '?').replace(/[A-Z]\d+$/, '') || '?';
  const entry: SceneEntry = { key: ++seq, label, el, captions };
  scenes.push(entry);
  scenes.sort((a, b) => a.el.offsetTop - b.el.offsetTop);
  return () => {
    const i = scenes.findIndex((s) => s.key === entry.key);
    if (i >= 0) scenes.splice(i, 1);
  };
}
