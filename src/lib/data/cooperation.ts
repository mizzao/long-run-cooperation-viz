export interface RoundPoint { game: number; rate: number | null }
export interface CooperationData {
  rounds: Record<'1' | '8' | '9' | '10', RoundPoint[]>;
  dayOfGame: number[];
}
export type Heartbeat = Record<string, (number | null)[]>;

interface RawCoop { rounds: Record<string, (number | null)[]>; dayOfGame: number[] }

const KEYS = ['1', '8', '9', '10'] as const;

export function parseCooperation(raw: unknown): CooperationData {
  const r = raw as RawCoop;
  if (!r || typeof r !== 'object' || !r.rounds || !Array.isArray(r.dayOfGame)) {
    throw new Error('parseCooperation: malformed input (expected { rounds, dayOfGame })');
  }
  for (const k of KEYS) {
    if (!Array.isArray(r.rounds[k]) || r.rounds[k].length !== r.dayOfGame.length) {
      throw new Error(`parseCooperation: rounds["${k}"] missing or length != dayOfGame (${r.dayOfGame.length})`);
    }
  }
  const rounds = Object.fromEntries(
    KEYS.map((k) => [k, r.rounds[k].map((rate, i) => ({ game: i + 1, rate }))])
  ) as CooperationData['rounds'];
  return { rounds, dayOfGame: r.dayOfGame };
}

export function parseHeartbeat(raw: unknown): Heartbeat {
  return raw as Heartbeat;
}

export function dayBoundaries(dayOfGame: number[]): number[] {
  const starts: number[] = [];
  let prev = 0;
  dayOfGame.forEach((d, i) => { if (d !== prev) { starts.push(i + 1); prev = d; } });
  return starts;
}

export function meanRate(points: RoundPoint[], fromGame: number, toGame: number): number {
  const xs = points.filter((p) => p.game >= fromGame && p.game <= toGame && p.rate !== null);
  if (xs.length === 0) {
    throw new Error(`meanRate: no non-null points in games ${fromGame}-${toGame}`);
  }
  return xs.reduce((s, p) => s + (p.rate as number), 0) / xs.length;
}

export function rollingMean(points: RoundPoint[], window: number): RoundPoint[] {
  return points.map((p, i) => {
    const acc: number[] = [];
    for (let j = i; j >= 0 && acc.length < window; j--) {
      const r = points[j].rate;
      if (r !== null) acc.push(r);
    }
    return { game: p.game, rate: acc.length ? acc.reduce((s, v) => s + v, 0) / acc.length : null };
  });
}

export function dailyMeans(points: RoundPoint[], dayOfGame: number[]): number[] {
  const sums = Array.from({ length: 20 }, () => ({ s: 0, n: 0 }));
  points.forEach((p, i) => {
    const d = dayOfGame[i];
    if (p.rate !== null && d >= 1 && d <= 20) { sums[d - 1].s += p.rate; sums[d - 1].n += 1; }
  });
  return sums.map(({ s, n }) => (n ? s / n : 0));
}

export function slopePerDay(means: number[], fromDay: number, toDay: number): number {
  return (means[toDay - 1] - means[fromDay - 1]) / (toDay - fromDay);
}
