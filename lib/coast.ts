// Coastline geometry for the chart. The gameplay grid is exact; only the drawn shoreline is
// organic: we trace the boundary of the land tiles, nudge it deterministically, then smooth it.
// Integer-only hashing keeps the result identical on every client.

import { GRID, LAND } from "./map";

type P = [number, number];

const hash = (x: number, y: number, salt: number) => {
  let h = Math.imul(x * 374761393 + y * 668265263 + salt * 1013904223, 1274126177);
  h ^= h >>> 13;
  h = Math.imul(h, 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const isLandAt = (r: number, c: number) => r >= 0 && c >= 0 && r < GRID && c < GRID && LAND[r * GRID + c];

/** Closed loops of tile-corner points, land on the right-hand side of travel. */
function traceLoops(): P[][] {
  const out = new Map<string, P[]>();
  const add = (a: P, b: P) => {
    const k = a.join(",");
    if (!out.has(k)) out.set(k, []);
    out.get(k)!.push(b);
  };
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (!LAND[r * GRID + c]) continue;
      if (!isLandAt(r - 1, c)) add([c, r], [c + 1, r]);
      if (!isLandAt(r, c + 1)) add([c + 1, r], [c + 1, r + 1]);
      if (!isLandAt(r + 1, c)) add([c + 1, r + 1], [c, r + 1]);
      if (!isLandAt(r, c - 1)) add([c, r + 1], [c, r]);
    }
  }
  const loops: P[][] = [];
  for (const [key, ends] of out) {
    while (ends.length) {
      const start = key.split(",").map(Number) as P;
      const pts: P[] = [start];
      let cur = ends.pop()!;
      while (cur.join(",") !== key) {
        pts.push(cur);
        cur = out.get(cur.join(","))!.pop()!;
      }
      loops.push(pts);
    }
  }
  return loops;
}

function smooth(loop: P[]): P[] {
  const n = loop.length;
  // 1. wobble the corners, and bow each edge's midpoint a little toward or away from the water
  const wobbled: P[] = [];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[(i + 1) % n];
    const a: P = [ax + (hash(ax, ay, 1) - 0.5) * 0.3, ay + (hash(ax, ay, 2) - 0.5) * 0.3];
    const dx = bx - ax;
    const dy = by - ay;
    const bow = (hash(ax + bx, ay + by, 3) - 0.5) * 0.5;
    wobbled.push(a, [(ax + bx) / 2 + dy * bow, (ay + by) / 2 - dx * bow]);
  }
  // 2. Chaikin corner cutting rounds everything into soft shoreline
  let pts = wobbled;
  for (let k = 0; k < 2; k++) {
    const next: P[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [px, py] = pts[i];
      const [qx, qy] = pts[(i + 1) % pts.length];
      next.push([0.75 * px + 0.25 * qx, 0.75 * py + 0.25 * qy], [0.25 * px + 0.75 * qx, 0.25 * py + 0.75 * qy]);
    }
    pts = next;
  }
  return pts;
}

/** SVG path of every island's shoreline, in board units (10 per tile). Use fill-rule evenodd. */
export const COAST_PATH = traceLoops()
  .map((l) => "M" + smooth(l).map(([x, y]) => `${(x * 10).toFixed(1)} ${(y * 10).toFixed(1)}`).join("L") + "Z")
  .join("");
