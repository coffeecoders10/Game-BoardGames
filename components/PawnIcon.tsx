import { PAWNS } from "@/lib/rules";

export function PawnIcon({ color, size = 36 }: { color: number; size?: number }) {
  const c = PAWNS[color % PAWNS.length];
  return (
    <svg width={size} height={size} viewBox="-5 -7 10 13" aria-hidden="true" style={{ flex: "none" }}>
      <ellipse cx={0} cy={5} rx={3.6} ry={1.1} fill="#000" opacity={0.22} />
      <path d="M-3.3,4.6 Q-3.2,0.8 -1.2,-0.8 L1.2,-0.8 Q3.2,0.8 3.3,4.6 Z" fill={c.hex} stroke={c.dark} strokeWidth={0.6} strokeLinejoin="round" />
      <circle cx={0} cy={-3.2} r={2.4} fill={c.hex} stroke={c.dark} strokeWidth={0.6} />
      <ellipse cx={-0.8} cy={-4} rx={0.75} ry={0.55} fill="#fff" opacity={0.6} />
    </svg>
  );
}
