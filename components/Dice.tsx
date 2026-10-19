import styles from "./Dice.module.css";

// Which way the cube must turn to bring each face to the front.
// Opposite faces sum to 7 (front 1 / back 6, right 3 / left 4, top 2 / bottom 5).
const FACE_TURN: Record<number, [number, number]> = {
  1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0],
};
const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

type Props = {
  value: number;
  rolls: number; // increments on every roll so the cube keeps tumbling forward
  canRoll: boolean;
  pending: boolean; // we asked the host to roll and are waiting
  onRoll: () => void;
};

export function Dice({ value, rolls, canRoll, pending, onRoll }: Props) {
  const [rx, ry] = FACE_TURN[value];
  // Whole extra turns don't change which face is in front, they just add spin.
  const transform = `rotateX(${rx + 720 * rolls}deg) rotateY(${ry + 1080 * rolls}deg)`;
  return (
    <button
      type="button"
      className={`${styles.stage} ${canRoll && !pending ? styles.ready : ""} ${pending ? styles.pending : ""}`}
      onClick={onRoll}
      disabled={!canRoll || pending}
      aria-label={canRoll ? "Roll the dice" : `Dice showing ${value}`}
    >
      <span key={rolls} className={styles.toss}>
        <span className={styles.cube} style={{ transform }}>
          {[1, 6, 3, 4, 2, 5].map((face) => (
            <span key={face} className={`${styles.face} ${styles[`f${face}`]}`}>
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className={PIPS[face].includes(i) ? styles.pip : undefined} />
              ))}
            </span>
          ))}
        </span>
      </span>
      <span className={styles.shadow} />
    </button>
  );
}
