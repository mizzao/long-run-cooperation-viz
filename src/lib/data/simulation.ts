export interface PhasePoint { alpha: number; r: number; se: number }
export interface Welfare { all: number; rational: number; resilient?: number }
export interface SimulationData {
  shares0: number[][];
  shares40: number[][];
  phase: PhasePoint[];
  welfare: { a0: Welfare; a40: Welfare };
  experiment: { alpha: number; r: number };
}

const BUCKETS = 5; // earlier(T1-7), T8, T9, T10, CC

function bucketRow(row: number[]): number[] {
  const early = row.slice(0, 7).reduce((s, v) => s + v, 0);
  return [early, row[7], row[8], row[9], row[10]];
}

export function parseSimulation(raw: unknown): SimulationData {
  const r = raw as { sharesAlpha0: number[][]; sharesAlpha40: number[][]; phase: PhasePoint[]; welfare: { a0: Welfare; a40: Welfare }; experiment: { alpha: number; r: number } };
  if (!r || !Array.isArray(r.sharesAlpha0) || !Array.isArray(r.phase)) {
    throw new Error('parseSimulation: malformed input');
  }
  return {
    shares0: r.sharesAlpha0.map(bucketRow),
    shares40: r.sharesAlpha40.map(bucketRow),
    phase: r.phase,
    welfare: r.welfare,
    experiment: r.experiment
  };
}

export function parseEmpiricalShares(raw: unknown): number[][] {
  const r = raw as Record<string, Record<string, number>>;
  if (!r || !r['1']) throw new Error('parseEmpiricalShares: malformed input');
  const out: number[][] = [];
  for (let d = 1; d <= 20; d++) {
    const day = r[String(d)] ?? {};
    const get = (k: string) => day[k] ?? 0;
    let early = get('other');
    for (let t = 1; t <= 7; t++) early += get('T' + t);
    const row = [early, get('T8'), get('T9'), get('T10'), get('CC')];
    const tot = row.reduce((s, v) => s + v, 0) || 1;
    out.push(row.map((v) => v / tot));
  }
  return out;
}
export const BUCKET_COUNT = BUCKETS;
