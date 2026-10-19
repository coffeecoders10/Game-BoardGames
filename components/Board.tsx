import { BoardArt } from "./BoardArt";
import { slotOffset, squareCenter, VIEW_H, VIEW_W } from "@/lib/board";
import { PAWNS, type Player } from "@/lib/rules";
import type { Flying } from "@/lib/useMoveAnimator";
import styles from "./Board.module.css";

type Props = {
  players: Player[];
  shown: Record<string, number>;
  flying: Flying | null;
  turnId: string | null;
  wobble: { pid: string; n: number } | null;
  meId: string;
};

function Pawn({ color, active, mine, wobbleKey }: { color: number; active: boolean; mine: boolean; wobbleKey: number }) {
  const c = PAWNS[color];
  return (
    <g>
      <ellipse cx={0} cy={3.1} rx={2.6} ry={0.9} fill="#2b1a0a" opacity={0.3} />
      <g key={wobbleKey} className={`${styles.pawn} ${active ? styles.active : ""} ${wobbleKey ? styles.wobble : ""}`}>
        <path d="M-2.5,3 Q-2.4,0.2 -0.9,-0.9 L0.9,-0.9 Q2.4,0.2 2.5,3 Z" fill={c.hex} stroke={c.dark} strokeWidth={0.45} strokeLinejoin="round" />
        <circle cx={0} cy={-2.5} r={1.75} fill={c.hex} stroke={c.dark} strokeWidth={0.45} />
        <ellipse cx={-0.6} cy={-3.1} rx={0.55} ry={0.4} fill="#fff" opacity={0.6} />
        {mine && <circle cx={0} cy={0.9} r={0.5} fill="#fff" opacity={0.9} />}
      </g>
    </g>
  );
}

export function Board({ players, shown, flying, turnId, wobble, meId }: Props) {
  // Draw the moving pawn last so it passes over the others.
  const ordered = [...players].sort((a, b) => Number(a.id === flying?.pid) - Number(b.id === flying?.pid));
  return (
    <div className={styles.frame}>
      <svg className={styles.svg} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Snakes and Ladders board">
        <BoardArt />
        {ordered.map((p) => {
          const base = flying?.pid === p.id ? flying : { ...squareCenter(shown[p.id] ?? p.pos), lift: 0 };
          const off = slotOffset(p.color);
          return (
            <g
              key={p.id}
              className={`${styles.token} ${p.online ? "" : styles.offline}`}
              transform={`translate(${base.x + off.x} ${base.y + off.y - base.lift})`}
            >
              <Pawn
                color={p.color}
                active={p.id === turnId}
                mine={p.id === meId}
                wobbleKey={wobble?.pid === p.id ? wobble.n : 0}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
