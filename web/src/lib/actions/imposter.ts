"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
  await requireUser("/games/imposter");
  const parsedName = displayNameSchema.safeParse(formData.get("displayName"));

  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_imposter_room", {
    p_display_name: parsedName.data,
  });

  if (error || !data?.[0]) {
    return {
      error: error?.message ?? "Could not create a room.",
    };
  }

  redirect(roomPath(data[0].room_code));
}

export async function joinRoomAction(
  _: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  await requireUser("/games/imposter");
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

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_imposter_room", {
    p_display_name: parsed.data.displayName,
    p_room_code: parsed.data.roomCode,
  });

  if (error || !data?.[0]) {
    return {
      error: error?.message ?? "Could not join the room.",
    };
  }

  redirect(roomPath(data[0].room_code));
}

export async function toggleReadyAction(input: {
  isReady: boolean;
  roomCode: string;
}): Promise<ActionResult> {
  await requireUser(roomPath(input.roomCode));

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_imposter_ready", {
    p_ready: input.isReady,
    p_room_code: normalizeRoomCode(input.roomCode),
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath(roomPath(input.roomCode));
  return { ok: true };
}

export async function startRoundAction(input: {
  roomCode: string;
}): Promise<ActionResult> {
  await requireUser(roomPath(input.roomCode));

  const supabase = await createClient();
  const { error } = await supabase.rpc("start_imposter_round", {
    p_room_code: normalizeRoomCode(input.roomCode),
  });

  if (error) {
    return {
      error: error.message,
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
  await requireUser(roomPath(input.roomCode));
  const parsed = clueSchema.safeParse(input.clue);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_imposter_clue", {
    p_clue: parsed.data,
    p_room_code: normalizeRoomCode(input.roomCode),
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath(roomPath(input.roomCode));
  return { ok: true };
}

export async function castVoteAction(input: {
  roomCode: string;
  targetPlayerId: string;
}): Promise<ActionResult> {
  await requireUser(roomPath(input.roomCode));
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

  const supabase = await createClient();
  const { error } = await supabase.rpc("cast_imposter_vote", {
    p_room_code: parsed.data.roomCode,
    p_target_room_player_id: parsed.data.targetPlayerId,
  });

  if (error) {
    return {
      error: error.message,
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
  await requireUser(roomPath(input.roomCode));

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_imposter_room", {
    p_room_code: normalizeRoomCode(input.roomCode),
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/games/imposter");
  return {
    ok: true,
    redirectTo: "/games/imposter",
  };
}
