import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { colOf, rowOf } from "@/lib/map";
import {
  CHARGES, RANGE, USE_COST, canUse, isActive, legalSteps, targetsFor,
  type GameState, type Player, type Powerup, type Weapon,
} from "@/lib/rules";
import { Board, FULL_VIEW, type View } from "./Board";
import { Dice } from "./Dice";
import { ITEM_INFO, ItemIcon } from "./ItemIcon";
import { Rules } from "./Rules";
import { Token } from "./Token";
import styles from "./Table.module.css";

type Props = {
  game: GameState;
  meId: string;
  hostId: string | null;
  connected: boolean;
  onRoll: () => void;
  onStep: (to: number) => void;
  onUse: (item: Powerup, target?: string) => void;
  onEnd: () => void;
  onAgain: () => void;
  onLeave: () => void;
};

const POWERUPS: Powerup[] = ["sword", "pistol", "cannon", "eyepatch"];
const isWeapon = (i: Powerup): i is Weapon => i !== "eyepatch";
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n) || ""}½`);

/** Close-up window: this many tiles across, centred on a tile and kept inside the chart. */
const CLOSE_TILES = 9;
function closeUp(tile: number): View {
  const size = CLOSE_TILES * 10;
  const lo = FULL_VIEW.x;
  const hi = FULL_VIEW.x + FULL_VIEW.size - size;
  const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
  return { x: clamp(colOf(tile) * 10 + 5 - size / 2), y: clamp(rowOf(tile) * 10 + 5 - size / 2), size };
}

export function Table({ game, meId, hostId, connected, onRoll, onStep, onUse, onEnd, onAgain, onLeave }: Props) {
  const me = game.players.find((p) => p.id === meId);
  const byId = (id: string | null) => game.players.find((p) => p.id === id);
  const turnPlayer = byId(game.turn);
  const playing = game.phase === "playing";
  const myTurn = playing && game.turn === meId && !!me;

  // "pending" = we asked the host to roll and no new roll has arrived yet.
  const [pendingRoll, setPendingRoll] = useState<number | null>(null);
  useEffect(() => {
    if (pendingRoll === null) return;
    const t = setTimeout(() => setPendingRoll(null), 4000);
    return () => clearTimeout(t);
  }, [pendingRoll]);
  const pending = pendingRoll === game.rolls;

  // Weapon being aimed. Drops away by itself when the turn or the weapon is gone.
  const [aimed, setAimed] = useState<Weapon | null>(null);
  const aim = aimed && me && myTurn && canUse(game, me, aimed) ? aimed : null;
  useEffect(() => {
    if (!aim) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAimed(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aim]);

  const steps = useMemo(() => (myTurn && me && !aim && connected ? legalSteps(game, me) : []), [game, me, myTurn, aim, connected]);
  const targets = aim && me ? targetsFor(game, me, aim).map((p) => p.id) : [];

  // Zoom: phones start close-up, because 20×20 tiles are tiny on a small screen.
  const [zoomed, setZoomed] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches);
  const focus = (myTurn ? me : turnPlayer)?.pos ?? me?.pos ?? 0;
  const view = useMemo(() => (zoomed ? closeUp(focus) : FULL_VIEW), [zoomed, focus]);

  // Only animate events that happen after we arrived.
  const [seenN] = useState(game.n);
  const last = game.log[game.log.length - 1];
  const fx = last && last.n > seenN ? last : null;

  const attack = (id: string) => {
    if (aim) onUse(aim, id);
    setAimed(null);
  };

  let headline: string;
  if (game.phase === "finished") headline = "The hunt is over";
  else if (!me) headline = "Watching";
  else if (turnPlayer && !turnPlayer.online) headline = "Waiting for them to reconnect…";
  else if (!myTurn) headline = game.stage === "roll" ? "About to roll" : "Moving";
  else if (game.stage === "roll") headline = pending ? "Rolling…" : "Roll the die";
  else if (aim) headline = targets.length ? `Pick a target for your ${aim}` : `Nobody in range of your ${aim}`;
  else headline = steps.length ? "Choose your next tile" : "No tiles in reach. Use an item or end your turn.";

  const finished = game.phase === "finished";
  const winner = byId(game.winner);
  const isHost = hostId === meId;
  const showMp = playing && game.stage === "move";

  return (
    <Tooltip.Provider delayDuration={250}>
      <div className={styles.table}>
        <header className={styles.top}>
          <h1 className={styles.brand}>Dead Reckoning</h1>
          <span className={styles.code}>Crew <b>{game.code}</b></span>
          <Rules />
          <button className="btn ghost" onClick={onLeave}>Leave</button>
        </header>

        <div className={styles.layout}>
          <div className={styles.boardCol}>
            <div className={styles.banner}>
              {turnPlayer && <Token seat={turnPlayer.color} name={turnPlayer.name} size={34} />}
              <p className={styles.headline} aria-live="polite">
                <b>{turnPlayer?.name}{myTurn ? " (you)" : ""}</b>
                <span className={myTurn ? styles.mine : ""}>{headline}</span>
              </p>
              {showMp && (
                <div className={styles.mp} aria-label={`${fmt(game.mp)} movement points left`}>
                  <b>{fmt(game.mp)}</b><span>moves left</span>
                </div>
              )}
            </div>

            <div className={styles.frame}>
              <Board game={game} meId={meId} view={view} steps={steps} range={aim ? RANGE[aim] : null} targets={targets} fx={fx} onStep={onStep} onTarget={attack} />
              <button className={`btn ghost ${styles.zoom}`} aria-pressed={zoomed} onClick={() => setZoomed((z) => !z)}>
                {zoomed ? "Show all" : "Zoom in"}
              </button>
            </div>
          </div>

          <aside className={styles.side}>
            <section className={styles.roller} aria-label="Dice">
              <Dice
                value={game.dice}
                rolls={game.rolls}
                canRoll={myTurn && game.stage === "roll" && connected}
                pending={pending}
                onRoll={() => {
                  setPendingRoll(game.rolls);
                  onRoll();
                }}
              />
              <div className={styles.rollerText}>
                <p>{game.dice ? `${turnPlayer?.name} rolled ${game.dice}` : "No roll yet"}</p>
                {myTurn && game.stage === "move" && (
                  <button className="btn teal" onClick={() => { setAimed(null); onEnd(); }}>End turn</button>
                )}
              </div>
            </section>

            {me && playing && <Inventory game={game} me={me} myTurn={myTurn} aim={aim} onAim={setAimed} onUse={onUse} />}

            <section aria-label="Crew">
              <h2 className={styles.h}>Crew</h2>
              <ul className={styles.crew}>
                {game.players.map((p) => (
                  <Crewmate key={p.id} p={p} turn={playing && p.id === game.turn} you={p.id === meId} />
                ))}
              </ul>
            </section>

            <section aria-label="Log">
              <h2 className={styles.h}>Log</h2>
              <ol className={styles.log}>
                {[...game.log].reverse().map((e) => <li key={e.n}>{e.text}</li>)}
                {game.log.length === 0 && <li>Roll the die to set sail.</li>}
              </ol>
            </section>
          </aside>
        </div>

        <Dialog.Root open={finished}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.modal} onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
              {winner ? (
                <>
                  <Token seat={winner.color} name={winner.name} size={64} />
                  <Dialog.Title>{winner.id === meId ? "You opened the chest" : `${winner.name} opened the chest`}</Dialog.Title>
                  <Dialog.Description>
                    {game.players.filter(isActive).length < 2 ? "Everyone else left." : "Key in hand, first to the treasure."}
                  </Dialog.Description>
                </>
              ) : (
                <>
                  <Dialog.Title>Everyone left</Dialog.Title>
                  <Dialog.Description>The treasure stays buried.</Dialog.Description>
                </>
              )}
              {isHost ? (
                <button className="btn" onClick={onAgain}>Play again</button>
              ) : (
                <p className={styles.wait}>Waiting for {byId(hostId)?.name ?? "the host"} to start another round…</p>
              )}
              <button className="btn ghost" onClick={onLeave}>Leave crew</button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </Tooltip.Provider>
  );
}

function Crewmate({ p, turn, you }: { p: Player; turn: boolean; you: boolean }) {
  const gear = POWERUPS.filter((k) => p.inv[k] > 0);
  return (
    <li className={`${styles.mate} ${turn ? styles.current : ""} ${p.left || !p.online ? styles.away : ""}`}>
      <Token seat={p.color} name={p.name} size={26} />
      <span className={styles.mname}>
        {p.name}
        {you && <small> you</small>}
        {p.left ? <small> left</small> : !p.online ? <small> offline</small> : null}
      </span>
      <span className={styles.badges}>
        {p.keys > 0 && <span className={styles.badge} title={`${p.keys} key${p.keys > 1 ? "s" : ""}`}><ItemIcon kind="key" size={14} />{p.keys}</span>}
        {p.ship && <span className={styles.badge} title="Has a ship"><ItemIcon kind="ship" size={14} /></span>}
        {gear.map((k) => (
          <span key={k} className={styles.badge} title={`${ITEM_INFO[k].label}: ${p.inv[k]}`}><ItemIcon kind={k} size={14} />{p.inv[k]}</span>
        ))}
      </span>
    </li>
  );
}

type InvProps = {
  game: GameState;
  me: Player;
  myTurn: boolean;
  aim: Weapon | null;
  onAim: (w: Weapon | null) => void;
  onUse: (item: Powerup) => void;
};

function Inventory({ game, me, myTurn, aim, onAim, onUse }: InvProps) {
  const reason = (item: Powerup): string | null => {
    if (me.inv[item] <= 0) return "You don't have one yet. Find it on the chart.";
    if (!myTurn) return "Wait for your turn.";
    if (game.stage === "roll") return "Roll the die first.";
    if (item === "eyepatch" && me.eyepatchOn) return "Already wearing it.";
    if (game.mp < USE_COST) return `Needs ${USE_COST} move point.`;
    if (isWeapon(item) && targetsFor(game, me, item).length === 0) return `No pirate within ${RANGE[item]} tile${RANGE[item] > 1 ? "s" : ""}.`;
    return null;
  };

  return (
    <section aria-label="Your gear">
      <div className={styles.invHead}>
        <h2 className={styles.h}>Gear</h2>
        <span className={styles.status}>
          <span className={me.keys ? styles.on : ""}><ItemIcon kind="key" size={16} /> {me.keys ? `${me.keys} key${me.keys > 1 ? "s" : ""}` : "No key"}</span>
          <span className={me.ship ? styles.on : ""}><ItemIcon kind="ship" size={16} /> {me.ship ? "Ship" : "No ship"}</span>
        </span>
      </div>
      <ul className={styles.slots}>
        {POWERUPS.map((item) => {
          const why = reason(item);
          const have = me.inv[item];
          const selected = aim === item;
          const worn = item === "eyepatch" && me.eyepatchOn;
          const click = () => {
            if (why && !selected) return;
            if (item === "eyepatch") onUse(item);
            else onAim(selected ? null : (item as Weapon));
          };
          return (
            <li key={item}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className={`${styles.slot} ${have ? styles.has : ""} ${selected ? styles.selected : ""} ${worn ? styles.worn : ""}`}
                    aria-pressed={isWeapon(item) ? selected : worn}
                    aria-disabled={!!why && !selected}
                    onClick={click}
                  >
                    <ItemIcon kind={item} size={26} />
                    <span className={styles.slotName}>{ITEM_INFO[item].label}</span>
                    <span className={styles.charges}>
                      {worn ? `on · ${have}` : have ? `${have} ${item === "eyepatch" ? "steps" : have > 1 ? "shots" : "shot"}` : "none"}
                    </span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className={styles.tip} sideOffset={6}>
                    <b>{ITEM_INFO[item].label}</b>
                    <span>{ITEM_INFO[item].blurb}</span>
                    <small>Costs {USE_COST} move point to use. Comes with {CHARGES[item]} {item === "eyepatch" ? "discounted steps" : "shots"}.</small>
                    {why && <em>{why}</em>}
                    <Tooltip.Arrow className={styles.arrow} />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </li>
          );
        })}
      </ul>
      {aim && <p className={styles.aimHint}>Aiming the {aim}. Select a highlighted pirate on the chart, or <button className={styles.link} onClick={() => onAim(null)}>cancel</button>.</p>}
    </section>
  );
}
