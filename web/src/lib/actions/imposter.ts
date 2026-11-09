"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import {
  castVote,
  createRoom,
  joinRoom,
  leaveRoom,
  setReady,
  startRound,
  submitClue,
} from "@/lib/local-store";
import { normalizeRoomCode } from "@/lib/utils";

export type RoomFormState = {
  error?: string;
};

export type ActionResult = {
  error?: string;
  ok?: true;
  redirectTo?: string;
};

const displayNameSchema = z
  .string()
  .trim()
  .max(40, "Display name must be 40 characters or fewer.")
  .optional()
  .transform((value) => value || null);

const roomCodeSchema = z
  .string()
  .trim()
  .transform((value) => normalizeRoomCode(value))
  .refine((value) => value.length >= 4, "Enter a valid room code.");

const clueSchema = z
  .string()
  .trim()
  .min(1, "Write a clue before submitting.")
  .max(120, "Keep the clue under 120 characters.");

function roomPath(roomCode: string) {
  return `/games/imposter/rooms/${normalizeRoomCode(roomCode)}`;
}

export async function createRoomAction(
  _: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await requireUser("/games/imposter");
  const parsedName = displayNameSchema.safeParse(formData.get("displayName"));

  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message };
  }

  redirect(roomPath(await createRoom(user, parsedName.data)));
}

export async function joinRoomAction(
  _: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const user = await requireUser("/games/imposter");
  const parsed = z
    .object({
      displayName: displayNameSchema,
      roomCode: roomCodeSchema,
    })
    .safeParse({
      displayName: formData.get("displayName"),
      roomCode: formData.get("roomCode"),
    });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Could not join the room.",
    };
  }

  const result = await joinRoom(user, parsed.data.roomCode, parsed.data.displayName);
  if (result.error || !result.code) {
    return {
      error: result.error ?? "Could not join the room.",
    };
  }

  redirect(roomPath(result.code));
}

export async function toggleReadyAction(input: {
  isReady: boolean;
  roomCode: string;
}): Promise<ActionResult> {
  const user = await requireUser(roomPath(input.roomCode));
  const error = await setReady(user, input.roomCode, input.isReady);

  if (error) {
    return {
      error,
    };
  }

  revalidatePath(roomPath(input.roomCode));
  return { ok: true };
}

export async function startRoundAction(input: {
  roomCode: string;
}): Promise<ActionResult> {
  const user = await requireUser(roomPath(input.roomCode));
  const error = await startRound(user, input.roomCode);

  if (error) {
    return {
      error,
    };
  }

  revalidatePath(roomPath(input.roomCode));
  revalidatePath("/games/imposter");
  return { ok: true };
}

export async function submitClueAction(input: {
  clue: string;
  roomCode: string;
}): Promise<ActionResult> {
  const user = await requireUser(roomPath(input.roomCode));
  const parsed = clueSchema.safeParse(input.clue);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message,
    };
  }

  const error = await submitClue(user, input.roomCode, parsed.data);

  if (error) {
    return {
      error,
    };
  }

  revalidatePath(roomPath(input.roomCode));
  return { ok: true };
}

export async function castVoteAction(input: {
  roomCode: string;
  targetPlayerId: string;
}): Promise<ActionResult> {
  const user = await requireUser(roomPath(input.roomCode));
  const parsed = z
    .object({
      roomCode: roomCodeSchema,
      targetPlayerId: z.string().uuid("Select a valid player."),
    })
    .safeParse({
      roomCode: input.roomCode,
      targetPlayerId: input.targetPlayerId,
    });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Could not cast vote.",
    };
  }

  const error = await castVote(user, parsed.data.roomCode, parsed.data.targetPlayerId);

  if (error) {
    return {
      error,
    };
  }

  revalidatePath(roomPath(input.roomCode));
  revalidatePath("/games/imposter");
  revalidatePath("/account");
  return { ok: true };
}

export async function leaveRoomAction(input: {
  roomCode: string;
}): Promise<ActionResult> {
  const user = await requireUser(roomPath(input.roomCode));
  await leaveRoom(user, input.roomCode);

  revalidatePath("/games/imposter");
  return {
    ok: true,
    redirectTo: "/games/imposter",
  };
}
