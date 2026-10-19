"use client";

// Turns "the host says this move happened" into a staged animation that every
// client plays the same way: dice tumble → hop square by square → slide/climb.
// While it plays, `shown` holds where pawns visibly are and `flying` is the
// pawn currently in motion. Moves that arrive mid-animation are queued.

import { useCallback, useEffect, useRef, useState } from "react";
import { along, snakeSpine, squareCenter, straight, type Pt } from "./board";
import type { GameState, Move } from "./rules";

export type Flying = { pid: string; x: number; y: number; lift: number };
export type Caption = { text: string; tone: "ladder" | "snake" | "info" | "win" };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const positions = (g: GameState) => Object.fromEntries(g.players.map((p) => [p.id, p.pos]));

export function useMoveAnimator(game: GameState | null) {
  const [shown, setShown] = useState<Record<string, number>>({});
  const [flying, setFlying] = useState<Flying | null>(null);
  const [dice, setDice] = useState({ value: 1, n: 0 });
  const [busy, setBusy] = useState(false);
  const [mover, setMover] = useState<string | null>(null);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [wobble, setWobble] = useState<{ pid: string; n: number } | null>(null);

  const queue = useRef<Move[]>([]);
  const running = useRef(false);
  const lastSeq = useRef<number | null>(null);
  const gameRef = useRef(game);
  const alive = useRef(true);
  const speed = useRef(1);

  useEffect(() => {
    alive.current = true;
    speed.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.3 : 1;
    return () => {
      alive.current = false;
    };
  }, []);

  const tween = useCallback(
    (ms: number, frame: (t: number) => void) =>
      new Promise<void>((resolve) => {
        const dur = ms * speed.current;
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / dur);
          if (!alive.current) return resolve();
          frame(t);
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    [],
  );

  const wait = useCallback((ms: number) => sleep(ms * speed.current), []);

  const play = useCallback(
    async (m: Move) => {
      const g = gameRef.current;
      const who = g?.players.find((p) => p.id === m.pid);
      const name = who?.name ?? "Someone";
      const fly = (p: Pt, lift = 0) => setFlying({ pid: m.pid, x: p.x, y: p.y, lift });
      const land = (sq: number) => {
        setShown((s) => ({ ...s, [m.pid]: sq }));
        setFlying(null);
      };

      setMover(m.pid);
      setCaption(null);
      setDice((d) => ({ value: m.dice, n: d.n + 1 }));
      await wait(1100);

      if (m.overshoot) {
        setCaption({ text: `${name} needs the exact number to finish`, tone: "info" });
        setWobble((w) => ({ pid: m.pid, n: (w?.n ?? 0) + 1 }));
        await wait(900);
        return;
      }

      for (let sq = m.from + 1; sq <= m.landed; sq++) {
        const a = squareCenter(sq - 1);
        const b = squareCenter(sq);
        await tween(190, (t) => fly(lerpPt(a, b, ease(t)), 4 * 2.4 * t * (1 - t)));
        land(sq);
      }

      if (m.jump) {
        const up = m.jump === "ladder";
        setCaption({ text: up ? `Ladder! Up to ${m.to}` : `Snake! Down to ${m.to}`, tone: m.jump });
        await wait(550);
        const path = up ? straight(m.landed, m.to) : snakeSpine(m.landed, m.to);
        await tween(up ? 1000 : 1300, (t) => fly(along(path, ease(t))));
        land(m.to);
      } else if (m.to === 100) {
        setCaption({ text: `${name} reaches the top!`, tone: "win" });
      } else if (m.bonus) {
        setCaption({ text: `A six — ${name} rolls again`, tone: "info" });
      }
      await wait(m.jump || m.bonus ? 700 : 350);
    },
    [tween, wait],
  );

  const drain = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    while (queue.current.length && alive.current) await play(queue.current.shift()!);
    running.current = false;
    if (!alive.current) return;
    setBusy(false);
    setMover(null);
    setCaption(null);
    if (gameRef.current) setShown(positions(gameRef.current)); // reconcile with the host
  }, [play]);

  // React to every state the host sends.
  useEffect(() => {
    gameRef.current = game;
    if (!game) {
      lastSeq.current = null;
      return;
    }
    const move = game.move;
    if (lastSeq.current !== null && move && move.seq === lastSeq.current + 1) {
      lastSeq.current = move.seq;
      queue.current.push(move);
      void drain();
      return;
    }
    // First state, new game, or we missed moves: just show the truth.
    lastSeq.current = game.seq;
    if (!running.current) setShown(positions(game));
  }, [game, drain]);

  return { shown, flying, dice, busy, mover, caption, wobble };
}
