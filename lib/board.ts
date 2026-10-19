// Board geometry in SVG units. The grid is 100×100 (each square 10×10);
// a 10-unit strip below it is the "start" area where pawns wait.

export type Pt = { x: number; y: number };

export const VIEW_W = 100;
export const VIEW_H = 110;

export function squareCenter(n: number): Pt {
  if (n <= 0) return { x: 8, y: 105 };
  const row = Math.floor((n - 1) / 10);
  const c = (n - 1) % 10;
  const col = row % 2 === 0 ? c : 9 - c;
  return { x: col * 10 + 5, y: (9 - row) * 10 + 5 };
}

/** Where each pawn sits inside its square so several can share one. */
const SLOTS: Pt[] = [
  { x: -2.3, y: -1.2 }, { x: 2.3, y: -1.2 }, { x: -2.3, y: 2.4 }, { x: 2.3, y: 2.4 },
];
export const slotOffset = (color: number): Pt => SLOTS[color % SLOTS.length];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A wriggling centre-line from a snake's head (high square) to its tail. */
export function snakeSpine(head: number, tail: number, samples = 40): Pt[] {
  const a = squareCenter(head);
  const b = squareCenter(tail);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const waves = Math.max(1.5, len / 22);
  const dir = head % 2 === 0 ? 1 : -1;
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const sway = Math.sin(t * Math.PI * 2 * waves) * 3.4 * Math.pow(Math.sin(t * Math.PI), 0.55) * dir;
    return { x: lerp(a.x, b.x, t) + nx * sway, y: lerp(a.y, b.y, t) + ny * sway };
  });
}

/** Outline polygon of a tapering snake body (thick head, thin tail). */
export function snakeBody(spine: Pt[]): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  spine.forEach((p, i) => {
    const prev = spine[Math.max(0, i - 1)];
    const next = spine[Math.min(spine.length - 1, i + 1)];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const l = Math.hypot(tx, ty) || 1;
    const w = lerp(2.1, 0.45, Math.pow(i / (spine.length - 1), 0.8));
    left.push({ x: p.x - (ty / l) * w, y: p.y + (tx / l) * w });
    right.push({ x: p.x + (ty / l) * w, y: p.y - (tx / l) * w });
  });
  return [...left, ...right.reverse()].map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

export const toPoints = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

export function ladderParts(bottom: number, top: number) {
  const a = squareCenter(bottom);
  const b = squareCenter(top);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const nx = -uy * 1.5;
  const ny = ux * 1.5;
  const rungs = Math.max(2, Math.floor(len / 4.2));
  return {
    rails: [
      { x1: a.x + nx, y1: a.y + ny, x2: b.x + nx, y2: b.y + ny },
      { x1: a.x - nx, y1: a.y - ny, x2: b.x - nx, y2: b.y - ny },
    ],
    rungs: Array.from({ length: rungs }, (_, i) => {
      const t = (i + 0.7) / (rungs + 0.4);
      const cx = lerp(a.x, b.x, t);
      const cy = lerp(a.y, b.y, t);
      return { x1: cx + nx, y1: cy + ny, x2: cx - nx, y2: cy - ny };
    }),
  };
}

/** Straight line points, used for a pawn climbing a ladder. */
export const straight = (from: number, to: number): Pt[] => [squareCenter(from), squareCenter(to)];

/** Position `t` (0..1) along a polyline, by arc length. */
export function along(pts: Pt[], t: number): Pt {
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const target = lens[lens.length - 1] * t;
  let i = 1;
  while (i < pts.length - 1 && lens[i] < target) i++;
  const seg = lens[i] - lens[i - 1] || 1;
  const k = (target - lens[i - 1]) / seg;
  return { x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k) };
}
