export interface MonthSession {
  day: number;
  slot: '1pm' | '3pm';
  // 20 waves; each pair is a 20-char string over {c,d,x}: player A rounds 1-10, then player B
  waves: string[][];
}
export interface MonthGrid { sessions: MonthSession[]; decisions: number }

export function parseMonth(raw: unknown): MonthGrid {
  const r = raw as { version: number; sessions: MonthSession[]; decisions: number };
  if (!r || r.version !== 1 || !Array.isArray(r.sessions) || r.sessions.length !== 40) {
    throw new Error('parseMonth: malformed input');
  }
  for (const s of r.sessions) {
    if (s.waves.length !== 20) throw new Error('parseMonth: bad wave count');
    for (const w of s.waves) {
      if (w.length < 19 || w.length > 28) throw new Error('parseMonth: bad pair count');
    }
  }
  return { sessions: r.sessions, decisions: r.decisions };
}
