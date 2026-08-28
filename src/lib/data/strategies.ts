export type StrategyGroup = 'CC' | 'T10' | 'T9' | 'T8' | 'earlier';

export interface PlayerStrategy {
  idx: number;
  group: StrategyGroup;
  earlyGroup: StrategyGroup;
  resilient: boolean;
  ccFracStable: number;
}

export const GROUP_ORDER = ['CC', 'T10', 'T9', 'T8', 'earlier'] as const;

interface RawRaster {
  players: { idx: number; ccFracStable: number; resilient: boolean }[];
  rows: number[][];
}

function modalGroup(row: number[], from: number, to: number, ccAllowed: boolean): StrategyGroup {
  const counts = new Map<number, number>();
  for (let c = from; c < to; c++) {
    const code = row[c];
    if (code === undefined || code < 1) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  let best = -1, bestN = -1;
  for (const [code, n] of counts) {
    if (n > bestN || (n === bestN && code > best)) { best = code; bestN = n; }
  }
  if (best === 11) return ccAllowed ? 'CC' : 'T10';
  if (best === 10) return 'T10';
  if (best === 9) return 'T9';
  if (best === 8) return 'T8';
  return 'earlier';
}

export function parseStrategies(raw: unknown): PlayerStrategy[] {
  const r = raw as RawRaster;
  if (!r || !Array.isArray(r.players) || !Array.isArray(r.rows) || r.players.length !== r.rows.length) {
    throw new Error('parseStrategies: malformed input (expected { players, rows } of equal length)');
  }
  const out = r.players.map((p, i) => ({
    idx: p.idx,
    resilient: p.resilient,
    ccFracStable: p.ccFracStable,
    group: (p.resilient ? 'CC' : modalGroup(r.rows[i], 120, 400, false)) as StrategyGroup,
    earlyGroup: modalGroup(r.rows[i], 0, 120, true)
  }));
  out.sort((a, b) => Number(b.resilient) - Number(a.resilient) || b.ccFracStable - a.ccFracStable);
  return out;
}

export function groupCounts(players: PlayerStrategy[]): Record<StrategyGroup, number> {
  const c: Record<StrategyGroup, number> = { CC: 0, T10: 0, T9: 0, T8: 0, earlier: 0 };
  for (const p of players) c[p.group] += 1;
  return c;
}
