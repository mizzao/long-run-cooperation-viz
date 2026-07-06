import { scaleLinear, type ScaleLinear } from 'd3-scale';

export interface ChartBox {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

const inner = (b: ChartBox) => ({
  x: [b.margin.left, b.width - b.margin.right] as [number, number],
  y: [b.height - b.margin.bottom, b.margin.top] as [number, number],
});

export function gameScale(box: ChartBox, maxGame = 400): ScaleLinear<number, number> {
  return scaleLinear().domain([1, maxGame]).range(inner(box).x);
}

export function rateScale(box: ChartBox): ScaleLinear<number, number> {
  return scaleLinear().domain([0, 1]).range(inner(box).y);
}

export function positionScale(box: ChartBox): ScaleLinear<number, number> {
  return scaleLinear().domain([1, 200]).range(inner(box).x);
}
