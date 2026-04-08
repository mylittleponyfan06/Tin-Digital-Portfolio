import { z } from "zod";

import type { TableRow } from "@/types/database";

const roomStatusSchema = z.enum([
  "lobby",
  "collecting_clues",
  "voting",
  "results",
  "closed",
]);

const roundStatusSchema = z.enum([
  "collecting_clues",
  "voting",
  "results",
  "completed",
]);

const winningTeamSchema = z.enum(["crew", "imposter", "draw"]);

const playerSchema = z.object({
  displayName: z.string(),
  id: z.string().uuid(),
  isHost: z.boolean(),
  isReady: z.boolean(),
  joinedAt: z.string(),
  score: z.number().int(),
  userId: z.string().uuid(),
});

const clueSchema = z.object({
  clue: z.string().nullable(),
  hasSubmitted: z.boolean(),
  roomPlayerId: z.string().uuid(),
});

const voteSchema = z.object({
  targetPlayerId: z.string().uuid(),
  voterPlayerId: z.string().uuid(),
});

const resultsSchema = z.object({
  detectedPlayerId: z.string().uuid().nullable().optional(),
  isTie: z.boolean().optional(),
  voteCounts: z
    .array(
      z.object({
        count: z.number().int().nonnegative(),
        targetPlayerId: z.string().uuid(),
      }),
    )
    .optional(),
  winningTeam: winningTeamSchema.optional(),
});

export const imposterRoomSnapshotSchema = z.object({
  currentPlayerId: z.string().uuid(),
  currentRound: z
    .object({
      clues: z.array(clueSchema),
      id: z.string().uuid(),
      imposterPlayerId: z.string().uuid().nullable(),
      privatePrompt: z.string().nullable(),
      results: resultsSchema.default({}),
      roundNumber: z.number().int().positive(),
      status: roundStatusSchema,
      topic: z.string().nullable(),
      votes: z.array(voteSchema),
    })
    .nullable(),
  currentUserId: z.string().uuid(),
  players: z.array(playerSchema),
  room: z.object({
    code: z.string(),
    hostUserId: z.string().uuid(),
    id: z.string().uuid(),
    status: roomStatusSchema,
  }),
});

export type ImposterRoomSnapshot = z.infer<typeof imposterRoomSnapshotSchema>;

export type ImposterLeaderboardEntry = Pick<
  TableRow<"leaderboard_entries">,
  "crew_wins" | "display_name" | "imposter_wins" | "rounds_played" | "wins"
>;
