// Session-tangle geometry, shared between the Experiment SVG and the month
// zoom-out canvas so the crossfade between them is pixel-identical.
export const W = 1240;
export const H = 660;

export const TG = { x0: 14, x1: 1226, y0: 66, sw: 30, pitchY: 17.2, rowH: 7, rowGap: 1.6 } as const;
export const colX = (i: number) => TG.x0 + (i * (TG.x1 - TG.x0 - TG.sw)) / 19;

// one session panel: 20 game columns x a 28-pair slot
export const SW = TG.x1 - TG.x0; // 1212
export const SH = 28 * TG.pitchY; // 481.6

// waves with fewer pairs are centered against the 28-pair slot
export const waveYOff = (pairs: number) => TG.y0 + ((28 - pairs) * TG.pitchY) / 2;

export const CELL = { c: '#15735B', d: '#D64A22', x: '#211E19' } as const;
