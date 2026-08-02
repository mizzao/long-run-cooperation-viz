export interface WelfareData { overallWelfare: number; overallCoopRate: number; meanPayoffPerRound: number }

export function parseWelfare(raw: unknown): WelfareData {
  const r = raw as { overallWelfare: number; overallCoopRate: number; meanPayoffPerRound: number };
  if (!r || typeof r.overallWelfare !== 'number' || typeof r.overallCoopRate !== 'number' || typeof r.meanPayoffPerRound !== 'number') {
    throw new Error('parseWelfare: malformed input');
  }
  return { overallWelfare: r.overallWelfare, overallCoopRate: r.overallCoopRate, meanPayoffPerRound: r.meanPayoffPerRound };
}
