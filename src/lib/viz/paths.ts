import { line } from 'd3-shape';
import type { ScaleLinear } from 'd3-scale';
import type { RoundPoint } from '../data/cooperation';

export function roundLinePath(
  points: RoundPoint[],
  x: ScaleLinear<number, number>,
  y: ScaleLinear<number, number>,
): string {
  const gen = line<RoundPoint>()
    .defined((p) => p.rate !== null)
    .x((p) => x(p.game))
    .y((p) => y(p.rate as number));
  return gen(points) ?? '';
}

export function heartbeatPath(
  values: (number | null)[],
  x: ScaleLinear<number, number>,
  y: ScaleLinear<number, number>,
): string {
  const pts = values.map((v, i) => ({ game: i + 1, rate: v }));
  return roundLinePath(pts, x, y);
}
