import { useEffect, useState } from "react";
import { PAWNS, type GameState } from "@/lib/rules";
import { useMoveAnimator } from "@/lib/useMoveAnimator";
import { Board } from "./Board";
import { Confetti } from "./Confetti";
import { Dice } from "./Dice";
import { PawnIcon } from "./PawnIcon";
import styles from "./Table.module.css";

type Props = {
  game: GameState;
  meId: string;
  hostId: string | null;
  connected: boolean;
  onRoll: () => void;
  onAgain: () => void;
  onLeave: () => void;
};

export function Table({ game, meId, hostId, connected, onRoll, onAgain, onLeave }: Props) {
  const anim = useMoveAnimator(game);
  const me = game.players.find((p) => p.id === meId);
  const byId = (id: string | null) => game.players.find((p) => p.id === id);

  // "pending" = we asked the host to roll and no new roll has arrived yet.
  const [pendingSeq, setPendingSeq] = useState<number | null>(null);
  useEffect(() => {
    if (pendingSeq === null) return;
    const t = setTimeout(() => setPendingSeq(null), 4000);
    return () => clearTimeout(t);
  }, [pendingSeq]);
  const pending = pendingSeq === game.seq;

  const myTurn = game.phase === "playing" && game.turn === meId;
  const canRoll = myTurn && !anim.busy && connected;
  const roll = () => {
    setPendingSeq(game.seq);
    onRoll();
  };

  // Keep the spotlight on whoever is moving until their animation is done.
  const spotlight = anim.busy ? anim.mover : game.phase === "playing" ? game.turn : null;
  const spot = byId(spotlight);

  let headline: string;
  if (anim.caption) headline = anim.caption.text;
  else if (anim.busy) headline = `${spot?.name ?? "Someone"} rolled a ${anim.dice.value}`;
  else if (game.phase === "finished") headline = "Game over";
  else if (!me) headline = `Watching — ${spot?.name ?? "…"}'s turn`;
  else if (myTurn) headline = pending ? "Rolling…" : "Your turn — tap the dice!";
  else headline = `${spot?.name ?? "Someone"}'s turn`;
  if (spot && !anim.busy && spot.online === false && game.phase === "playing") {
    headline = `Waiting for ${spot.name} to reconnect…`;
  }

  const finished = game.phase === "finished" && !anim.busy;
  const winner = byId(game.winner);
  const isHost = hostId === meId;

  return (
    <div className={styles.table}>
      <header className={styles.top}>
        <span className={styles.code}>Table <b>{game.code}</b></span>
        <button className="btn ghost" onClick={onLeave}>Leave</button>
      </header>

      <div className={styles.layout}>
        <div className={styles.boardCol}>
          <Board
            players={game.players}
            shown={anim.shown}
            flying={anim.flying}
            turnId={spotlight}
            wobble={anim.wobble}
            meId={meId}
          />
        </div>

        <aside className={styles.side}>
          <ul className={styles.players}>
            {game.players.map((p) => {
              const sq = anim.shown[p.id] ?? p.pos;
              return (
                <li
                  key={p.id}
                  className={`${styles.player} ${p.id === spotlight ? styles.current : ""} ${p.left || !p.online ? styles.away : ""}`}
                  style={{ "--hue": PAWNS[p.color].hex } as React.CSSProperties}
                >
                  <PawnIcon color={p.color} size={34} />
                  <span className={styles.pname}>
                    {p.name}
                    {p.id === meId && <small> (you)</small>}
                    {p.left ? <small> · left</small> : !p.online ? <small> · offline</small> : null}
                  </span>
                  <span className={styles.square}>{sq === 0 ? "start" : sq}</span>
                </li>
              );
            })}
          </ul>

          <div className={styles.roller}>
            <Dice value={anim.dice.value} rolls={anim.dice.n} canRoll={canRoll} pending={pending} onRoll={roll} />
            <p
              key={headline}
              className={`${styles.headline} ${anim.caption ? styles[anim.caption.tone] : ""} ${myTurn && !anim.busy ? styles.you : ""}`}
              aria-live="polite"
            >
              {headline}
            </p>
          </div>
        </aside>
      </div>

      {finished && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="win-title">
          <Confetti />
          <div className={styles.modal}>
            {winner ? (
              <>
                <PawnIcon color={winner.color} size={84} />
                <h2 id="win-title">{winner.id === meId ? "You win!" : `${winner.name} wins!`}</h2>
                <p>{winner.left ? "" : game.players.filter((p) => !p.left).length < 2 ? "Everyone else left the table." : "First to land exactly on 100."}</p>
              </>
            ) : (
              <h2 id="win-title">Everyone left</h2>
            )}
            {isHost ? (
              <button className="btn" onClick={onAgain}>Play again</button>
            ) : (
              <p className={styles.wait}>Waiting for {byId(hostId)?.name ?? "the host"} to set up another round…</p>
            )}
            <button className="btn ghost" onClick={onLeave}>Leave table</button>
          </div>
        </div>
      )}
    </div>
  );
}
