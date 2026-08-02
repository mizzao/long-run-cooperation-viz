// World layout and camera for the month zoom-out. World units are the session
// viewBox coordinates (tangleGeom): day-1 1pm sits at its SVG position, so a
// camera at K0 is identity with the existing session rendering.
import { beat } from '$lib/scroll/progress';
import { W, H, TG, SW, SH } from './tangleGeom';

export interface Cam { k: number; cx: number; cy: number }

const GS = 30; // gap between 1pm and 3pm panels within a day
const GX = 90; // gap between day columns
const GY = 56; // gap between week rows
const DAY_H = 2 * SH + GS; // 1023.2
export const GRID = { w: 5 * SW + 4 * GX, h: 4 * DAY_H + 3 * GY }; // 6620 x 4452.8

// packed 5x4 grid of days, day 1 top-left, pinned so day-1 1pm keeps its SVG origin
export function panelPos(day: number, slot: '1pm' | '3pm') {
  const row = Math.floor((day - 1) / 5);
  const col = (day - 1) % 5;
  return {
    x: TG.x0 + col * (SW + GX),
    y: TG.y0 + row * (DAY_H + GY) + (slot === '3pm' ? SH + GS : 0)
  };
}

const K0: Cam = { k: 1, cx: W / 2, cy: H / 2 };
const K1: Cam = { k: (0.86 * H) / DAY_H, cx: W / 2, cy: TG.y0 + DAY_H / 2 };
// near-full-height, biased slightly upward so the caption card mostly clears the last row
const K2: Cam = { k: (0.96 * H) / GRID.h, cx: TG.x0 + GRID.w / 2, cy: TG.y0 + GRID.h / 2 + 100 };

const KEYS: { t: number; cam: Cam }[] = [
  { t: 0, cam: K0 },
  { t: 0.24, cam: K1 },
  { t: 0.46, cam: K1 }, // hold: "one day, two sessions"
  { t: 0.86, cam: K2 },
  { t: 1, cam: K2 } // hold: the finale caption
];

const smooth = (u: number) => u * u * (3 - 2 * u);

export function camera(t: number): Cam {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = smooth(beat(t, a.t, b.t));
  return {
    k: a.cam.k * Math.pow(b.cam.k / a.cam.k, u), // geometric zoom
    cx: a.cam.cx + (b.cam.cx - a.cam.cx) * u,
    cy: a.cam.cy + (b.cam.cy - a.cam.cy) * u
  };
}

// how the SVG's viewBox (W x H, xMidYMid meet) maps into a cw x ch container
export function viewport(cw: number, ch: number) {
  const s0 = Math.min(cw / W, ch / H);
  return { s0, ox: (cw - W * s0) / 2, oy: (ch - H * s0) / 2 };
}

// which day cell a world point falls in (gaps count toward the nearest cell);
// `cell` is the day's world rect, used to keep the magnifier framed on content
export function hitTest(xw: number, yw: number): { day: number; slot: '1pm' | '3pm'; cell: { x: number; y: number; w: number; h: number } } | null {
  const lx = xw - TG.x0;
  const ly = yw - TG.y0;
  const pad = 30;
  if (lx < -pad || ly < -pad || lx > GRID.w + pad || ly > GRID.h + pad) return null;
  const col = Math.max(0, Math.min(4, Math.floor(lx / (SW + GX))));
  const row = Math.max(0, Math.min(3, Math.floor(ly / (DAY_H + GY))));
  const slot = ly - row * (DAY_H + GY) < SH + GS / 2 ? '1pm' : '3pm';
  return {
    day: row * 5 + col + 1,
    slot,
    cell: { x: TG.x0 + col * (SW + GX), y: TG.y0 + row * (DAY_H + GY), w: SW, h: DAY_H }
  };
}
