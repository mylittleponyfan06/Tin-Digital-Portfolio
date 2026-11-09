import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard, getRoomSnapshot } from "@/lib/local-store";
import type { ImposterLeaderboardEntry, ImposterRoomSnapshot } from "@/lib/imposter/types";

export async function getImposterRoomSnapshot(
  roomCode: string,
): Promise<ImposterRoomSnapshot | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return getRoomSnapshot(user, roomCode);
}

export async function getImposterLeaderboard(limit = 10): Promise<ImposterLeaderboardEntry[]> {
  return getLeaderboard(limit);
}
