// Pure game rules. Every function takes a GameState and returns a new one
// (or the same object when nothing changed). Only the room host runs these;
// everyone else just renders the state the host broadcasts.

export const BOARD_SIZE = 100;
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

export const LADDERS: Record<number, number> = {
  2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94,
};
export const SNAKES: Record<number, number> = {
  16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80,
};

export const PAWNS = [
  { name: "Tomato", hex: "#e4572e", dark: "#9c3416" },
  { name: "Teal", hex: "#1b9aaa", dark: "#0c5e69" },
  { name: "Mustard", hex: "#f2b134", dark: "#a8760a" },
  { name: "Plum", hex: "#8e5aa8", dark: "#5a2f73" },
] as const;

export type Phase = "lobby" | "playing" | "finished";

export type Player = {
  id: string;
  name: string;
  color: number; // index into PAWNS
  pos: number; // 0 = not yet on the board
  online: boolean;
  left: boolean; // quit mid-game; skipped forever
};

export type Move = {
  seq: number;
  pid: string;
  dice: number;
  from: number;
  landed: number; // square after the dice, before any snake/ladder
  to: number; // final square
  jump: "ladder" | "snake" | null;
  overshoot: boolean; // roll too high to finish; stays put
  bonus: boolean; // rolled a 6, goes again
};

export type GameState = {
  v: number; // bumped on every change; receivers keep the highest
  code: string;
  phase: Phase;
  players: Player[];
  turn: string; // player id
  seq: number; // rolls so far
  move: Move | null; // the most recent roll
  winner: string | null;
};

export function createGame(code: string, id: string, name: string): GameState {
  return {
    v: 1,
    code,
    phase: "lobby",
    players: [{ id, name, color: 0, pos: 0, online: true, left: false }],
    turn: id,
    seq: 0,
    move: null,
    winner: null,
  };
}

export const isActive = (p: Player) => !p.left;

/** The host is the first player (in join order) who is still here. */
export function pickHost(s: GameState, present: ReadonlySet<string>): string | null {
  return s.players.find((p) => isActive(p) && present.has(p.id))?.id ?? null;
}

export function addPlayer(s: GameState, id: string, name: string): GameState {
  const existing = s.players.find((p) => p.id === id);
  if (existing) {
    if (existing.left || (existing.online && existing.name === name)) return s;
    return {
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, online: true, name } : p)),
    };
  }
  if (s.phase !== "lobby" || s.players.length >= MAX_PLAYERS) return s;
  const taken = new Set(s.players.map((p) => p.color));
  const color = PAWNS.findIndex((_, i) => !taken.has(i));
  return { ...s, players: [...s.players, { id, name, color, pos: 0, online: true, left: false }] };
}

/** Sync `online` flags with who is really in the socket room. */
export function setPresence(s: GameState, present: ReadonlySet<string>): GameState {
  let players = s.players.map((p) =>
    p.online === present.has(p.id) ? p : { ...p, online: present.has(p.id) },
  );
  if (s.phase === "lobby") players = players.filter((p) => p.online);
  const unchanged = players.length === s.players.length && players.every((p, i) => p === s.players[i]);
  return unchanged ? s : { ...s, players };
}

export function startGame(s: GameState): GameState {
  const ready = s.players.filter((p) => p.online);
  if (s.phase !== "lobby" || ready.length < MIN_PLAYERS) return s;
  return {
    ...s,
    phase: "playing",
    players: ready.map((p) => ({ ...p, pos: 0 })),
    turn: ready[0].id,
    seq: 0,
    move: null,
    winner: null,
  };
}

export function backToLobby(s: GameState): GameState {
  if (s.phase !== "finished") return s;
  const players = s.players.filter((p) => isActive(p) && p.online).map((p) => ({ ...p, pos: 0 }));
  return { ...s, phase: "lobby", players, move: null, winner: null, seq: 0, turn: players[0]?.id ?? s.turn };
}

/** Next player after the current one who is here (falls back to the current one). */
function nextTurnId(s: GameState): string {
  const n = s.players.length;
  const start = s.players.findIndex((p) => p.id === s.turn);
  for (let i = 1; i <= n; i++) {
    const p = s.players[(start + i) % n];
    if (isActive(p) && p.online) return p.id;
  }
  return s.turn;
}

export function skipOfflineTurn(s: GameState): GameState {
  if (s.phase !== "playing") return s;
  if (s.players.find((p) => p.id === s.turn)?.online) return s;
  const turn = nextTurnId(s);
  return turn === s.turn ? s : { ...s, turn };
}

export function roll(s: GameState, pid: string, dice: number): GameState {
  const player = s.players.find((p) => p.id === pid);
  if (s.phase !== "playing" || s.turn !== pid || !player) return s;

  const target = player.pos + dice;
  const overshoot = target > BOARD_SIZE;
  const landed = overshoot ? player.pos : target;
  const to = LADDERS[landed] ?? SNAKES[landed] ?? landed;
  const jump = to > landed ? "ladder" : to < landed ? "snake" : null;
  const won = to === BOARD_SIZE;
  const bonus = dice === 6 && !won;

  const move: Move = { seq: s.seq + 1, pid, dice, from: player.pos, landed, to, jump, overshoot, bonus };
  const next: GameState = {
    ...s,
    seq: move.seq,
    move,
    players: s.players.map((p) => (p.id === pid ? { ...p, pos: to } : p)),
  };
  if (won) return { ...next, phase: "finished", winner: pid };
  return bonus ? next : { ...next, turn: nextTurnId(next) };
}

/** Someone quit on purpose. */
export function removePlayer(s: GameState, id: string): GameState {
  if (!s.players.some((p) => p.id === id)) return s;
  if (s.phase === "lobby") return { ...s, players: s.players.filter((p) => p.id !== id) };

  let next: GameState = { ...s, players: s.players.map((p) => (p.id === id ? { ...p, left: true } : p)) };
  if (next.phase === "playing") {
    const remaining = next.players.filter(isActive);
    if (remaining.length <= 1) return { ...next, phase: "finished", winner: remaining[0]?.id ?? null };
    if (next.turn === id) next = { ...next, turn: nextTurnId(next) };
  }
  return next;
}
