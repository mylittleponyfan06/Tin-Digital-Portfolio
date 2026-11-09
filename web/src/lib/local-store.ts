import "server-only";

import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeRoomCode } from "@/lib/utils";
import type { ImposterLeaderboardEntry, ImposterRoomSnapshot } from "@/lib/imposter/types";

type User = {
  createdAt: string;
  email: string;
  id: string;
  passwordHash: string;
};

type Profile = {
  bio: string | null;
  createdAt: string;
  displayName: string;
  id: string;
  username: string | null;
};

type Room = {
  code: string;
  hostUserId: string;
  id: string;
  status: "lobby" | "collecting_clues" | "voting" | "results" | "closed";
};

type RoomPlayer = {
  displayName: string;
  id: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: string;
  roomId: string;
  score: number;
  userId: string;
};

type Round = {
  id: string;
  imposterPlayerId: string;
  roomId: string;
  roundNumber: number;
  status: "collecting_clues" | "voting" | "results" | "completed";
  topic: string;
};

type Clue = {
  clue: string | null;
  roomPlayerId: string;
  roundId: string;
};

type Vote = {
  roundId: string;
  targetPlayerId: string;
  voterPlayerId: string;
};

type LeaderboardEntry = ImposterLeaderboardEntry & {
  userId: string;
};

type Session = {
  token: string;
  userId: string;
};

type Store = {
  clues: Clue[];
  leaderboard: LeaderboardEntry[];
  profiles: Profile[];
  roomPlayers: RoomPlayer[];
  rooms: Room[];
  rounds: Round[];
  sessions: Session[];
  users: User[];
  votes: Vote[];
};

export type LocalUser = Pick<User, "createdAt" | "email" | "id">;

const dataPath = path.join(process.cwd(), ".data", "app.json");
const topics = ["pizza toppings", "school subjects", "video games", "guitar pedals", "rainy day plans"];

function emptyStore(): Store {
  return {
    clues: [],
    leaderboard: [],
    profiles: [],
    roomPlayers: [],
    rooms: [],
    rounds: [],
    sessions: [],
    users: [],
    votes: [],
  };
}

async function readStore(): Promise<Store> {
  try {
    return { ...emptyStore(), ...JSON.parse(await readFile(dataPath, "utf8")) };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: Store) {
  // ponytail: single JSON file is for local/dev use; move to SQLite if concurrent writes matter.
  await mkdir(path.dirname(dataPath), { recursive: true });
  const tempPath = `${dataPath}.${process.pid}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2));
  await rename(tempPath, dataPath);
}

async function updateStore<T>(fn: (store: Store) => T) {
  const store = await readStore();
  const result = fn(store);
  await writeStore(store);
  return result;
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    return false;
  }

  const actual = Buffer.from(hashPassword(password, salt).split(":")[1], "hex");
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicUser(user: User): LocalUser {
  return { createdAt: user.createdAt, email: user.email, id: user.id };
}

export async function createSession(userId: string) {
  return updateStore((store) => {
    const token = randomBytes(32).toString("hex");
    store.sessions.push({ token: createHash("sha256").update(token).digest("hex"), userId });
    return token;
  });
}

export async function deleteSession(token: string | undefined) {
  if (!token) {
    return;
  }

  const hashed = createHash("sha256").update(token).digest("hex");
  await updateStore((store) => {
    store.sessions = store.sessions.filter((session) => session.token !== hashed);
  });
}

export async function getUserByToken(token: string | undefined): Promise<LocalUser | null> {
  if (!token) {
    return null;
  }

  const store = await readStore();
  const session = store.sessions.find(
    (item) => item.token === createHash("sha256").update(token).digest("hex"),
  );
  const user = session && store.users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

export async function createUser(input: {
  displayName?: string;
  email: string;
  password: string;
}) {
  return updateStore((store) => {
    const email = input.email.toLowerCase();
    if (store.users.some((user) => user.email === email)) {
      return { error: "That email is already registered." };
    }

    const now = new Date().toISOString();
    const user: User = {
      createdAt: now,
      email,
      id: randomUUID(),
      passwordHash: hashPassword(input.password),
    };
    store.users.push(user);
    store.profiles.push({
      bio: null,
      createdAt: now,
      displayName: input.displayName || email,
      id: user.id,
      username: null,
    });

    return { user: publicUser(user) };
  });
}

export async function signInUser(email: string, password: string) {
  const store = await readStore();
  const user = store.users.find((item) => item.email === email.toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  return { user: publicUser(user) };
}

export async function getProfile(userId: string) {
  const store = await readStore();
  return store.profiles.find((profile) => profile.id === userId) ?? null;
}

export async function updateProfile(
  user: LocalUser,
  input: { bio: string | null; displayName: string; username: string | null },
) {
  await updateStore((store) => {
    const profile = store.profiles.find((item) => item.id === user.id);
    if (profile) {
      Object.assign(profile, input);
    } else {
      store.profiles.push({ ...input, createdAt: user.createdAt, id: user.id });
    }
  });
}

function displayName(store: Store, user: LocalUser, fallback: string | null) {
  return fallback || store.profiles.find((profile) => profile.id === user.id)?.displayName || user.email;
}

function makeRoomCode(store: Store) {
  let code = "";
  do {
    code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
  } while (store.rooms.some((room) => room.code === code));
  return code;
}

export async function createRoom(user: LocalUser, fallbackName: string | null) {
  return updateStore((store) => {
    const room: Room = {
      code: makeRoomCode(store),
      hostUserId: user.id,
      id: randomUUID(),
      status: "lobby",
    };
    store.rooms.push(room);
    store.roomPlayers.push({
      displayName: displayName(store, user, fallbackName),
      id: randomUUID(),
      isHost: true,
      isReady: false,
      joinedAt: new Date().toISOString(),
      roomId: room.id,
      score: 0,
      userId: user.id,
    });
    return room.code;
  });
}

export async function joinRoom(user: LocalUser, code: string, fallbackName: string | null) {
  return updateStore((store) => {
    const room = store.rooms.find((item) => item.code === normalizeRoomCode(code));
    if (!room || room.status === "closed") {
      return { error: "Room not found." };
    }

    let player = store.roomPlayers.find((item) => item.roomId === room.id && item.userId === user.id);
    if (!player) {
      player = {
        displayName: displayName(store, user, fallbackName),
        id: randomUUID(),
        isHost: false,
        isReady: false,
        joinedAt: new Date().toISOString(),
        roomId: room.id,
        score: 0,
        userId: user.id,
      };
      store.roomPlayers.push(player);
    }

    return { code: room.code };
  });
}

export async function setReady(user: LocalUser, code: string, ready: boolean) {
  return updateStore((store) => {
    const player = getPlayer(store, user.id, code);
    if (!player) {
      return "Room membership not found.";
    }

    player.isReady = ready;
    return null;
  });
}

export async function startRound(user: LocalUser, code: string) {
  return updateStore((store) => {
    const room = store.rooms.find((item) => item.code === normalizeRoomCode(code));
    if (!room) {
      return "Room not found.";
    }

    const players = store.roomPlayers.filter((player) => player.roomId === room.id);
    if (room.hostUserId !== user.id) {
      return "Only the host can start the round.";
    }
    if (players.length < 3 || players.some((player) => !player.isReady)) {
      return "Need at least 3 ready players.";
    }

    const roundNumber = store.rounds.filter((round) => round.roomId === room.id).length + 1;
    const imposter = players[Math.floor(Math.random() * players.length)];
    const round: Round = {
      id: randomUUID(),
      imposterPlayerId: imposter.id,
      roomId: room.id,
      roundNumber,
      status: "collecting_clues",
      topic: topics[Math.floor(Math.random() * topics.length)],
    };
    room.status = "collecting_clues";
    store.rounds.push(round);
    store.clues.push(...players.map((player) => ({ clue: null, roomPlayerId: player.id, roundId: round.id })));
    return null;
  });
}

export async function submitClue(user: LocalUser, code: string, clueText: string) {
  return updateStore((store) => {
    const room = store.rooms.find((item) => item.code === normalizeRoomCode(code));
    const player = getPlayer(store, user.id, code);
    const round = room && currentRound(store, room.id);
    const clue = player && round && store.clues.find((item) => item.roundId === round.id && item.roomPlayerId === player.id);

    if (!room || !player || !round || !clue || round.status !== "collecting_clues") {
      return "Clues are not open.";
    }

    clue.clue = clueText;
    if (store.clues.filter((item) => item.roundId === round.id).every((item) => item.clue)) {
      round.status = "voting";
      room.status = "voting";
    }
    return null;
  });
}

export async function castVote(user: LocalUser, code: string, targetPlayerId: string) {
  return updateStore((store) => {
    const room = store.rooms.find((item) => item.code === normalizeRoomCode(code));
    const voter = getPlayer(store, user.id, code);
    const round = room && currentRound(store, room.id);
    const target = room && store.roomPlayers.find((player) => player.roomId === room.id && player.id === targetPlayerId);

    if (!room || !voter || !round || !target || round.status !== "voting") {
      return "Voting is not open.";
    }
    if (target.id === voter.id) {
      return "You cannot vote for yourself.";
    }
    if (store.votes.some((vote) => vote.roundId === round.id && vote.voterPlayerId === voter.id)) {
      return "You already voted.";
    }

    store.votes.push({ roundId: round.id, targetPlayerId: target.id, voterPlayerId: voter.id });

    const players = store.roomPlayers.filter((player) => player.roomId === room.id);
    if (store.votes.filter((vote) => vote.roundId === round.id).length >= players.length) {
      finishRound(store, room, round, players);
    }
    return null;
  });
}

export async function leaveRoom(user: LocalUser, code: string) {
  await updateStore((store) => {
    const room = store.rooms.find((item) => item.code === normalizeRoomCode(code));
    if (!room) {
      return;
    }

    store.roomPlayers = store.roomPlayers.filter(
      (player) => !(player.roomId === room.id && player.userId === user.id),
    );

    const remaining = store.roomPlayers.filter((player) => player.roomId === room.id);
    if (!remaining.length) {
      room.status = "closed";
      return;
    }

    if (room.hostUserId === user.id) {
      remaining[0].isHost = true;
      room.hostUserId = remaining[0].userId;
    }
  });
}

export async function getRoomSnapshot(user: LocalUser, code: string): Promise<ImposterRoomSnapshot | null> {
  const store = await readStore();
  const room = store.rooms.find((item) => item.code === normalizeRoomCode(code));
  const player = room && store.roomPlayers.find((item) => item.roomId === room.id && item.userId === user.id);
  if (!room || !player) {
    return null;
  }

  const round = currentRound(store, room.id);
  return {
    currentPlayerId: player.id,
    currentRound: round
      ? {
          clues: store.clues
            .filter((clue) => clue.roundId === round.id)
            .map((clue) => ({
              clue: round.status === "collecting_clues" ? null : clue.clue,
              hasSubmitted: Boolean(clue.clue),
              roomPlayerId: clue.roomPlayerId,
            })),
          id: round.id,
          imposterPlayerId: round.status === "results" ? round.imposterPlayerId : null,
          privatePrompt: round.imposterPlayerId === player.id ? "You are the imposter." : round.topic,
          results: round.status === "results" ? roundResults(store, round) : {},
          roundNumber: round.roundNumber,
          status: round.status,
          topic: round.status === "results" ? round.topic : null,
          votes: store.votes.filter((vote) => vote.roundId === round.id),
        }
      : null,
    currentUserId: user.id,
    players: store.roomPlayers
      .filter((item) => item.roomId === room.id)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
      .map((player) => ({
        displayName: player.displayName,
        id: player.id,
        isHost: player.isHost,
        isReady: player.isReady,
        joinedAt: player.joinedAt,
        score: player.score,
        userId: player.userId,
      })),
    room: {
      code: room.code,
      hostUserId: room.hostUserId,
      id: room.id,
      status: room.status,
    },
  };
}

export async function getLeaderboard(limit = 10): Promise<ImposterLeaderboardEntry[]> {
  const store = await readStore();
  return store.leaderboard
    .toSorted((a, b) => b.wins - a.wins || b.rounds_played - a.rounds_played)
    .slice(0, limit)
    .map((entry) => ({
      crew_wins: entry.crew_wins,
      display_name: entry.display_name,
      imposter_wins: entry.imposter_wins,
      rounds_played: entry.rounds_played,
      wins: entry.wins,
    }));
}

export async function getUserLeaderboard(userId: string) {
  const store = await readStore();
  return store.leaderboard.find((entry) => entry.userId === userId) ?? null;
}

function getPlayer(store: Store, userId: string, code: string) {
  const room = store.rooms.find((item) => item.code === normalizeRoomCode(code));
  return room ? store.roomPlayers.find((item) => item.roomId === room.id && item.userId === userId) : null;
}

function currentRound(store: Store, roomId: string) {
  return store.rounds
    .filter((round) => round.roomId === roomId && round.status !== "completed")
    .toSorted((a, b) => b.roundNumber - a.roundNumber)[0] ?? null;
}

function roundResults(store: Store, round: Round) {
  const voteCounts = store.votes
    .filter((vote) => vote.roundId === round.id)
    .reduce<{ count: number; targetPlayerId: string }[]>((counts, vote) => {
      const existing = counts.find((item) => item.targetPlayerId === vote.targetPlayerId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.push({ count: 1, targetPlayerId: vote.targetPlayerId });
      }
      return counts;
    }, []);
  const top = voteCounts.toSorted((a, b) => b.count - a.count);
  const isTie = top.length > 1 && top[0].count === top[1].count;
  const detectedPlayerId = isTie ? null : top[0]?.targetPlayerId ?? null;
  return {
    detectedPlayerId,
    isTie,
    voteCounts,
    winningTeam: detectedPlayerId === round.imposterPlayerId ? "crew" : "imposter",
  } as const;
}

function finishRound(store: Store, room: Room, round: Round, players: RoomPlayer[]) {
  round.status = "results";
  room.status = "results";
  const results = roundResults(store, round);
  const winnerIds =
    results.winningTeam === "crew"
      ? players.filter((player) => player.id !== round.imposterPlayerId).map((player) => player.userId)
      : [players.find((player) => player.id === round.imposterPlayerId)?.userId].filter(Boolean);

  for (const player of players) {
    const profile = store.profiles.find((item) => item.id === player.userId);
    const entry =
      store.leaderboard.find((item) => item.userId === player.userId) ??
      store.leaderboard[
        store.leaderboard.push({
          crew_wins: 0,
          display_name: profile?.displayName ?? player.displayName,
          imposter_wins: 0,
          rounds_played: 0,
          userId: player.userId,
          wins: 0,
        }) - 1
      ];

    entry.display_name = profile?.displayName ?? player.displayName;
    entry.rounds_played += 1;
    if (winnerIds.includes(player.userId)) {
      entry.wins += 1;
      player.score += 1;
      if (player.id === round.imposterPlayerId) {
        entry.imposter_wins += 1;
      } else {
        entry.crew_wins += 1;
      }
    }
  }
}
