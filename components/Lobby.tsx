import { useState } from "react";
import { MAX_PLAYERS, MIN_PLAYERS, PAWNS, type GameState } from "@/lib/rules";
import { PawnIcon } from "./PawnIcon";
import styles from "./Lobby.module.css";

type Props = {
  game: GameState;
  meId: string;
  hostId: string | null;
  onStart: () => void;
  onLeave: () => void;
};

export function Lobby({ game, meId, hostId, onStart, onLeave }: Props) {
  const [copied, setCopied] = useState(false);
  const me = game.players.find((p) => p.id === meId);
  const isHost = hostId === meId;
  const host = game.players.find((p) => p.id === hostId);
  const ready = game.players.filter((p) => p.online).length;

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${game.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this invite link:", url);
    }
  };

  return (
    <section className={styles.wrap} aria-labelledby="lobby-title">
      <h2 id="lobby-title" className={styles.kicker}>Table code</h2>
      <div className={styles.code} aria-label={`Table code ${game.code.split("").join(" ")}`}>
        {game.code.split("").map((ch, i) => (
          <span key={i} style={{ animationDelay: `${i * 70}ms` }}>{ch}</span>
        ))}
      </div>
      <button className="btn ghost" onClick={copy}>{copied ? "Link copied!" : "Copy invite link"}</button>

      <ul className={styles.seats}>
        {Array.from({ length: MAX_PLAYERS }, (_, i) => {
          const p = game.players[i];
          return p ? (
            <li key={p.id} className={styles.seat} style={{ "--hue": PAWNS[p.color].hex } as React.CSSProperties}>
              <PawnIcon color={p.color} size={46} />
              <span className={styles.name}>{p.name}</span>
              <span className={styles.badges}>
                {p.id === hostId && <b>host</b>}
                {p.id === meId && <b>you</b>}
              </span>
            </li>
          ) : (
            <li key={`empty${i}`} className={`${styles.seat} ${styles.empty}`}>
              <span className={styles.ghost} aria-hidden="true" />
              <span className={styles.name}>Open seat</span>
            </li>
          );
        })}
      </ul>

      {!me ? (
        <p className={styles.hint}>This table is full, or the game already started.</p>
      ) : isHost ? (
        <>
          <button className="btn" disabled={ready < MIN_PLAYERS} onClick={onStart}>Start the game</button>
          <p className={styles.hint}>
            {ready < MIN_PLAYERS ? "Share the code — you need at least 2 players." : "Everyone in? Let's roll."}
          </p>
        </>
      ) : (
        <p className={styles.hint}>Waiting for {host?.name ?? "the host"} to start…</p>
      )}

      <button className="btn ghost" onClick={onLeave}>Leave table</button>
    </section>
  );
}
