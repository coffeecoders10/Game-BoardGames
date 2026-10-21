import styles from "./Dice.module.css";

const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

type Props = {
  value: number | null;
  rolls: number; // increments on every roll so the die re-tumbles
  canRoll: boolean;
  pending: boolean; // we asked the host to roll and are waiting
  onRoll: () => void;
};

export function Dice({ value, rolls, canRoll, pending, onRoll }: Props) {
  const face = value ?? 0;
  return (
    <button
      type="button"
      className={`${styles.die} ${canRoll && !pending ? styles.ready : ""} ${pending ? styles.pending : ""}`}
      onClick={onRoll}
      disabled={!canRoll || pending}
      aria-label={canRoll ? "Roll the die" : face ? `Die showing ${face}` : "Die"}
    >
      <span key={rolls} className={styles.face}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={PIPS[face]?.includes(i) ? styles.pip : undefined} />
        ))}
      </span>
    </button>
  );
}
