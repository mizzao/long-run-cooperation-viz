export interface GroupStat { mean: number; se: number | null; n: number }
export interface DayPayoff { day: number; cc: GroupStat; threshold: GroupStat }

export function parsePayoffs(raw: unknown): DayPayoff[] {
  const r = raw as DayPayoff[];
  if (!Array.isArray(r) || r.length !== 20 || !r[0]?.cc || !r[0]?.threshold) {
    throw new Error('parsePayoffs: malformed input (expected 20 rows with cc/threshold)');
  }
  return r;
}

export function stableGap(rows: DayPayoff[]): number {
  const gaps = rows.slice(6).map((d) => d.threshold.mean - d.cc.mean);
  return gaps.reduce((s, v) => s + v, 0) / gaps.length;
}
