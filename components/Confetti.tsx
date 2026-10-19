import type { CSSProperties } from "react";
import styles from "./Confetti.module.css";

const COLORS = ["#e4572e", "#1b9aaa", "#f2b134", "#8e5aa8", "#4caf6a", "#fff4dc"];

// Deterministic "randomness" so server and client render the same markup.
export function Confetti() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      {Array.from({ length: 44 }, (_, i) => (
        <i
          key={i}
          className={styles.bit}
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: COLORS[i % COLORS.length],
              animationDelay: `${(i % 11) * 0.13}s`,
              animationDuration: `${2.6 + (i % 5) * 0.4}s`,
              "--drift": `${((i * 53) % 90) - 45}px`,
              "--spin": `${360 + ((i * 71) % 540)}deg`,
              width: 7 + (i % 3) * 3,
              height: 11 + (i % 4) * 2,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
