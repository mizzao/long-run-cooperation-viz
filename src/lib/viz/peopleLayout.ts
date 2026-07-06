export interface P { x: number; y: number }
export interface Area { x: number; y: number; w: number; h: number }

export function gridPos(i: number, n: number, cols: number, area: Area): P {
  const rows = Math.ceil(n / cols);
  const cw = area.w / cols;
  const rh = area.h / rows;
  return {
    x: area.x + ((i % cols) + 0.5) * cw,
    y: area.y + (Math.floor(i / cols) + 0.5) * rh
  };
}

export function columnPos(groupIndex: number, rank: number, perRow: number, spacing: number, area: Area): P {
  const colW = area.w / 5;
  const cx = area.x + (groupIndex + 0.5) * colW;
  const row = Math.floor(rank / perRow);
  const col = rank % perRow;
  return {
    x: cx + (col - (perRow - 1) / 2) * spacing,
    y: area.y + area.h - row * spacing
  };
}

export function lerpPos(a: P, b: P, t: number): P {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
