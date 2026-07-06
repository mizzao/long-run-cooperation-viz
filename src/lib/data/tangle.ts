export interface TanglePair {
  a: number;
  b: number;
  ca: (0 | 1 | null)[];
  cb: (0 | 1 | null)[];
}

export interface TangleWave {
  slot: number;
  pairs: TanglePair[];
}

export interface Tangle {
  nPlayers: number;
  waves: TangleWave[];
  /** localIdx of a player present in every wave (used for the follow path) */
  followIdx: number;
}

export function parseTangle(raw: unknown): Tangle {
  const o = raw as { nPlayers: number; games: TangleWave[] };
  if (!o || !Array.isArray(o.games) || o.games.length !== 20) {
    throw new Error('tangle: expected 20 waves');
  }
  for (const w of o.games) {
    for (const pr of w.pairs) {
      if (pr.ca.length !== 10 || pr.cb.length !== 10) throw new Error('tangle: bad cells');
      for (const v of [...pr.ca, ...pr.cb]) {
        if (v !== 0 && v !== 1 && v !== null) throw new Error('tangle: bad value');
      }
    }
  }
  const everyWave = (idx: number) =>
    o.games.every((w) => w.pairs.some((pr) => pr.a === idx || pr.b === idx));
  let followIdx = 0;
  for (let i = 0; i < o.nPlayers; i++) {
    if (everyWave(i)) {
      followIdx = i;
      break;
    }
  }
  return { nPlayers: o.nPlayers, waves: o.games, followIdx };
}
