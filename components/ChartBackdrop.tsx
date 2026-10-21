import { Chart } from "./Board";
import styles from "./ChartBackdrop.module.css";

/** The real chart, dimmed, behind the home and lobby screens. */
export function ChartBackdrop() {
  return (
    <svg className={styles.backdrop} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Chart labels={false} />
    </svg>
  );
}
