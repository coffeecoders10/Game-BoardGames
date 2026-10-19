import { memo } from "react";
import { ladderParts, snakeBody, snakeSpine, squareCenter, VIEW_H, VIEW_W } from "@/lib/board";
import { LADDERS, SNAKES } from "@/lib/rules";

const TILES = ["#fbe3b0", "#cfe8d8", "#f9c4ad", "#d3dcf5", "#f6efb8"];
const SNAKE_SKINS = [
  { body: "#3f9d5a", edge: "#1f5c33", spot: "#bfe8a8" },
  { body: "#8b5cc4", edge: "#4a2a7a", spot: "#e2cdfa" },
  { body: "#e0603f", edge: "#8d2c14", spot: "#ffd9a0" },
  { body: "#2f9db3", edge: "#13596a", spot: "#c4f1f7" },
  { body: "#d4a017", edge: "#805d00", spot: "#fff0b0" },
];

function Tiles() {
  const goal = squareCenter(100);
  return (
    <>
      {Array.from({ length: 100 }, (_, i) => {
        const n = i + 1;
        const { x, y } = squareCenter(n);
        const row = Math.floor(i / 10);
        const col = (x - 5) / 10;
        return (
          <g key={n}>
            <rect x={x - 5} y={y - 5} width={10} height={10} fill={TILES[(col + row * 2) % TILES.length]} stroke="#fffaf0" strokeWidth={0.35} />
            <text x={x - 4.1} y={y - 2.6} fontSize={2.7} fontWeight={800} fill="#6b4a2b" opacity={0.75}>
              {n}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${goal.x + 0.5} ${goal.y + 1.6})`}>
        <polygon
          points="0,-3.2 1,-1 3.4,-0.8 1.5,0.8 2.1,3.1 0,1.8 -2.1,3.1 -1.5,0.8 -3.4,-0.8 -1,-1"
          fill="#ffc83d" stroke="#b27d00" strokeWidth={0.4} strokeLinejoin="round"
        />
      </g>
    </>
  );
}

function Ladders() {
  return (
    <>
      {Object.entries(LADDERS).map(([bottom, top]) => {
        const { rails, rungs } = ladderParts(+bottom, top);
        return (
          <g key={bottom} strokeLinecap="round">
            <g transform="translate(0.7 0.9)" stroke="#3b2410" opacity={0.28} strokeWidth={1.1}>
              {rails.map((r, i) => <line key={i} {...r} />)}
            </g>
            {rungs.map((r, i) => <line key={i} {...r} stroke="#7a4a22" strokeWidth={1.3} />)}
            {rungs.map((r, i) => <line key={`l${i}`} {...r} stroke="#e2a95f" strokeWidth={0.7} />)}
            {rails.map((r, i) => <line key={`o${i}`} {...r} stroke="#7a4a22" strokeWidth={1.6} />)}
            {rails.map((r, i) => <line key={`i${i}`} {...r} stroke="#d99a52" strokeWidth={0.9} />)}
          </g>
        );
      })}
    </>
  );
}

function Snakes() {
  return (
    <>
      {Object.entries(SNAKES).map(([head, tail], idx) => {
        const skin = SNAKE_SKINS[idx % SNAKE_SKINS.length];
        const spine = snakeSpine(+head, tail);
        const [p0, p1] = [spine[0], spine[2]];
        const ang = (Math.atan2(p0.y - p1.y, p0.x - p1.x) * 180) / Math.PI;
        return (
          <g key={head}>
            <polygon points={snakeBody(spine)} transform="translate(0.7 0.9)" fill="#3b2410" opacity={0.25} />
            <polygon points={snakeBody(spine)} fill={skin.body} stroke={skin.edge} strokeWidth={0.5} strokeLinejoin="round" />
            {spine.filter((_, i) => i % 3 === 1 && i < spine.length - 3).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={Math.max(0.35, 1 - i * 0.055)} fill={skin.spot} opacity={0.85} />
            ))}
            <g transform={`translate(${p0.x} ${p0.y}) rotate(${ang})`}>
              <path d="M2.2,0 L4.6,-0.5 M2.2,0 L4.6,0.5" stroke="#d6283a" strokeWidth={0.4} strokeLinecap="round" fill="none" />
              <ellipse cx={0.4} cy={0} rx={2.9} ry={2.3} fill={skin.body} stroke={skin.edge} strokeWidth={0.5} />
              <circle cx={0.9} cy={-1.1} r={0.75} fill="#fff" />
              <circle cx={0.9} cy={1.1} r={0.75} fill="#fff" />
              <circle cx={1.1} cy={-1.1} r={0.38} fill="#1b1209" />
              <circle cx={1.1} cy={1.1} r={0.38} fill="#1b1209" />
            </g>
          </g>
        );
      })}
    </>
  );
}

/** The printed board: tiles, ladders, snakes. Static, so it never re-renders. */
export const BoardArt = memo(function BoardArt() {
  return (
    <>
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#fff4dc" />
      <Tiles />
      <rect x={0} y={100} width={VIEW_W} height={10} fill="#efd9a6" />
      <text x={16} y={106.6} fontSize={3.6} fontWeight={800} fill="#8a6234" letterSpacing={0.5}>START</text>
      <Ladders />
      <Snakes />
    </>
  );
});
