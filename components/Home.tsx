import { PawnIcon } from "./PawnIcon";
import styles from "./Home.module.css";

type Props = {
  name: string;
  code: string;
  error: string | null;
  onName: (v: string) => void;
  onCode: (v: string) => void;
  onCreate: () => void;
  onJoin: () => void;
};

const TITLE = ["S", "n", "a", "k", "e", "s"];
const TITLE2 = ["L", "a", "d", "d", "e", "r", "s"];

export function Home({ name, code, error, onName, onCode, onCreate, onJoin }: Props) {
  const hasName = name.trim().length > 0;
  const canJoin = hasName && code.length === 5;
  return (
    <div className={styles.box}>
      <div className={styles.pawns} aria-hidden="true">
        {[0, 1, 2, 3].map((c) => (
          <span key={c} style={{ animationDelay: `${c * 0.15}s` }}><PawnIcon color={c} size={44} /></span>
        ))}
      </div>
      <h1 className={styles.title} aria-label="Snakes and Ladders">
        <span aria-hidden="true">
          {TITLE.map((l, i) => <i key={i} className={styles.tile} style={{ "--i": i } as React.CSSProperties}>{l}</i>)}
        </span>
        <span className={styles.amp} aria-hidden="true">&amp;</span>
        <span aria-hidden="true">
          {TITLE2.map((l, i) => <i key={i} className={styles.tile} style={{ "--i": i + 6 } as React.CSSProperties}>{l}</i>)}
        </span>
      </h1>
      <p className={styles.tag}>Race to 100. Climb the ladders, dodge the snakes.</p>

      <form className={styles.card} onSubmit={(e) => { e.preventDefault(); (canJoin ? onJoin : onCreate)(); }}>
        <label className={styles.field}>
          <span>Your name</span>
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={14}
            placeholder="e.g. Ada"
            autoComplete="nickname"
            enterKeyHint="go"
          />
        </label>

        <button type="button" className="btn" disabled={!hasName} onClick={onCreate}>
          Set up a new table
        </button>

        <div className={styles.or}><span>or join friends</span></div>

        <div className={styles.joinRow}>
          <label className={styles.field}>
            <span className="srOnly">Table code</span>
            <input
              className={styles.code}
              value={code}
              onChange={(e) => onCode(e.target.value)}
              placeholder="CODE"
              maxLength={5}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-label="Table code"
            />
          </label>
          <button type="button" className="btn teal" disabled={!canJoin} onClick={onJoin}>Join</button>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>

      <p className={styles.rules}>
        2–4 players · roll a 6 to go again · you must land exactly on 100
      </p>
    </div>
  );
}
