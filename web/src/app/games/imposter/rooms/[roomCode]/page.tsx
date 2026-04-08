import { notFound } from "next/navigation";

import { ImposterRoomClient } from "@/components/games/imposter/imposter-room-client";
import { requireUser } from "@/lib/auth";
import { getImposterRoomSnapshot } from "@/lib/imposter/queries";

type RoomPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

export async function generateMetadata({ params }: RoomPageProps) {
  const { roomCode } = await params;

  return {
    title: `Room ${roomCode.toUpperCase()}`,
  };
}

export default async function ImposterRoomPage({ params }: RoomPageProps) {
  const { roomCode } = await params;
  await requireUser(`/games/imposter/rooms/${roomCode}`);

  const snapshot = await getImposterRoomSnapshot(roomCode);

  if (!snapshot) {
    notFound();
  }

  return <ImposterRoomClient snapshot={snapshot} />;
}
