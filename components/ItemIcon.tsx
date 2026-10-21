import type { ItemKind } from "@/lib/rules";

export type GlyphName = ItemKind | "ship" | "anchor" | "chest";

export const ITEM_INFO: Record<ItemKind, { label: string; blurb: string }> = {
  key: { label: "Key", blurb: "Carry one to the chest to open it and win." },
  sword: { label: "Sword", blurb: "Strikes a pirate within 1 tile." },
  pistol: { label: "Pistol", blurb: "Shoots a pirate within 2 tiles." },
  cannon: { label: "Cannon", blurb: "Fires at a pirate within 4 tiles." },
  eyepatch: { label: "Eyepatch", blurb: "Halves every step's cost until the charges run out." },
};

/** Monoline icons on a 24×24 grid. Stroke comes from `currentColor`. */
export function GlyphPaths({ name }: { name: GlyphName }) {
  switch (name) {
    case "key":
      return (<><circle cx={7.5} cy={8.5} r={3.8} /><path d="M10.4 11.4 L20.5 21.5 M16.6 17.6 l2.6 -2.6 M13.6 14.6 l2 -2" /></>);
    case "sword":
      return (<><path d="M19.5 4.5 L9 15 M19.5 4.5 H15 M19.5 4.5 V9" /><path d="M6 12 L12 18 M9 15 L5 19 M4 20 l1.5 -1.5" /></>);
    case "pistol":
      return (<path d="M3 8.5 H17 L20.5 10.5 V13.5 H12.5 L11 21 H6.5 L8.2 13.5 H3 Z" />);
    case "cannon":
      return (<><rect x={3} y={7.5} width={15} height={6} rx={2.2} transform="rotate(-18 10 10.5)" /><circle cx={10} cy={17.5} r={3.6} /><circle cx={20.5} cy={5} r={1.2} /></>);
    case "eyepatch":
      return (<><path d="M2.5 7.5 Q12 3.5 21.5 7.5" /><path d="M7.5 9 Q12 7 16.5 9 Q18 14.5 14.8 17.8 Q12 20 9.2 17.8 Q6 14.5 7.5 9 Z" /></>);
    case "ship":
      return (<><path d="M3 15.5 H21 L18 20.5 H6 Z" /><path d="M12 3.5 V15.5 M12 4.5 L18.5 13.5 H12" /></>);
    case "anchor":
      return (<><circle cx={12} cy={5} r={2} /><path d="M12 7 V21 M7.5 11 H16.5 M4.5 14.5 A7.5 7 0 0 0 19.5 14.5" /></>);
    case "chest":
      return (<><path d="M3.5 11 C3.5 6.5 7.5 4.5 12 4.5 C16.5 4.5 20.5 6.5 20.5 11 Z" /><path d="M3.5 11 V19.5 H20.5 V11 M12 9.5 V14" /></>);
  }
}

/** For use inside an existing <svg>, drawn on a 24-unit canvas. */
export function Glyph({ name, width = 1.6 }: { name: GlyphName; width?: number }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <GlyphPaths name={name} />
    </g>
  );
}

export function ItemIcon({ kind, size = 24 }: { kind: GlyphName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
      <Glyph name={kind} />
    </svg>
  );
}
