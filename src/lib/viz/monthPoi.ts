// Turns a marked point's grid address (day / slot / wave / pair) into a world
// rect in monthCamera space, and pulls out the decision strings it refers to.
// Resolved once, after the month data loads.
import { TG, colX, waveYOff } from './tangleGeom';
import { panelPos } from './monthCamera';
import type { MonthSession } from '$lib/data/month';
import { monthPois, type MonthPoi } from '$lib/content/monthPois';

export interface WorldRect { x: number; y: number; w: number; h: number }

export interface ResolvedPoi extends MonthPoi {
  rect: WorldRect;
  cx: number;
  cy: number;
  /** one 20-char string for a game, the whole column for a wave */
  pairs: string[];
  /** "day 14 · 13:00 · game 14 of 20" */
  address: string;
}

const GAME_H = 2 * TG.rowH + TG.rowGap;

export function resolvePois(sessions: readonly MonthSession[]): ResolvedPoi[] {
  const out: ResolvedPoi[] = [];
  for (const poi of monthPois) {
    const session = sessions.find((s) => s.day === poi.day && s.slot === poi.slot);
    const wave = session?.waves[poi.wave - 1];
    if (!wave) continue;
    if (poi.kind === 'game' && (poi.pair === undefined || !wave[poi.pair - 1])) continue;

    const panel = panelPos(poi.day, poi.slot);
    const x = panel.x + colX(poi.wave - 1) - TG.x0;
    const top = panel.y + waveYOff(wave.length) - TG.y0;

    const rect: WorldRect =
      poi.kind === 'game'
        ? { x, y: top + (poi.pair! - 1) * TG.pitchY, w: TG.sw, h: GAME_H }
        : { x, y: top, w: TG.sw, h: (wave.length - 1) * TG.pitchY + GAME_H };

    out.push({
      ...poi,
      rect,
      cx: rect.x + rect.w / 2,
      cy: rect.y + rect.h / 2,
      pairs: poi.kind === 'game' ? [wave[poi.pair! - 1]] : [...wave],
      address: `day ${poi.day} · ${poi.slot === '1pm' ? '13:00' : '15:00'} · game ${poi.wave} of 20`
    });
  }
  return out;
}

/** Screen (css px) position of a world point under the current camera. */
export function projector(
  cam: { k: number; cx: number; cy: number },
  view: { s0: number; ox: number; oy: number },
  W: number,
  H: number
) {
  return (xw: number, yw: number) => ({
    x: view.ox + view.s0 * (W / 2 + cam.k * (xw - cam.cx)),
    y: view.oy + view.s0 * (H / 2 + cam.k * (yw - cam.cy))
  });
}
