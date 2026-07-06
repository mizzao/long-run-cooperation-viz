export interface WelfareData { overallWelfare: number; overallCoopRate: number }

export function parseWelfare(raw: unknown): WelfareData {
  const r = raw as { overallWelfare: number; overallCoopRate: number };
  if (!r || typeof r.overallWelfare !== 'number' || typeof r.overallCoopRate !== 'number') {
    throw new Error('parseWelfare: malformed input');
  }
  return { overallWelfare: r.overallWelfare, overallCoopRate: r.overallCoopRate };
}
