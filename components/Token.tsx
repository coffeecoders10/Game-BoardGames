import { SEATS } from "@/lib/rules";

const INK = "#0b1015";

/** A player's marker: a distinct shape and colour with their initial. Drawn on a -5..5 canvas. */
export function TokenShape({ seat, letter }: { seat: number; letter: string }) {
  const s = SEATS[seat % SEATS.length];
  const common = { fill: s.hex, stroke: INK, strokeWidth: 0.7, strokeLinejoin: "round" as const };
  let shape;
  let dy = 0;
  switch (s.shape) {
    case "square": shape = <rect x={-3.6} y={-3.6} width={7.2} height={7.2} rx={1.4} {...common} />; break;
    case "diamond": shape = <path d="M0 -4.9 L4.9 0 L0 4.9 L-4.9 0 Z" {...common} />; break;
    case "triangle": shape = <path d="M0 -4.6 L4.6 3.6 L-4.6 3.6 Z" {...common} />; dy = 1; break;
    case "hexagon": shape = <path d="M-2.4 -4.2 H2.4 L4.8 0 L2.4 4.2 H-2.4 L-4.8 0 Z" {...common} />; break;
    default: shape = <circle r={4.2} {...common} />;
  }
  return (
    <>
      {shape}
      <text y={dy + 0.1} textAnchor="middle" dominantBaseline="central" fontSize={4.4} fontWeight={700} fill={INK} style={{ fontFamily: "var(--ui)" }}>
        {letter}
      </text>
    </>
  );
}

export const initial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

export function Token({ seat, name, size = 28 }: { seat: number; name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-5.6 -5.6 11.2 11.2" aria-hidden="true" style={{ flex: "none" }}>
      <TokenShape seat={seat} letter={initial(name)} />
    </svg>
  );
}
