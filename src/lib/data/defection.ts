export type DefectionBins = Record<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'C', number>;

const BIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'C'] as const;

export function parseDefection(raw: unknown): DefectionBins[] {
  const r = raw as Record<string, Record<string, number>>;
  if (!r || typeof r !== 'object' || !r['1'] || !r['20']) {
    throw new Error('parseDefection: malformed input (expected day keys 1..20)');
  }
  return Array.from({ length: 20 }, (_, i) => {
    const day = r[String(i + 1)];
    if (!day) throw new Error(`parseDefection: malformed input (missing day ${i + 1})`);
    return Object.fromEntries(BIN_KEYS.map((k) => [k, day[k] ?? 0])) as DefectionBins;
  });
}

export function binFractions(bins: DefectionBins): number[] {
  const vals = BIN_KEYS.map((k) => bins[k]);
  const total = vals.reduce((s, v) => s + v, 0) || 1;
  return vals.map((v) => v / total);
}
