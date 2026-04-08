import { normalizeRoomCode } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import {
  imposterRoomSnapshotSchema,
  type ImposterLeaderboardEntry,
  type ImposterRoomSnapshot,
} from "@/lib/imposter/types";

export async function getImposterRoomSnapshot(
  roomCode: string,
): Promise<ImposterRoomSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_imposter_room_snapshot", {
    p_room_code: normalizeRoomCode(roomCode),
  });

  if (error || !data) {
    return null;
  }

  const parsed = imposterRoomSnapshotSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export async function getImposterLeaderboard(limit = 10): Promise<ImposterLeaderboardEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("crew_wins, display_name, imposter_wins, rounds_played, wins")
    .eq("game_slug", "imposter")
    .order("wins", { ascending: false })
    .order("rounds_played", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return data ?? [];
}
