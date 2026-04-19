"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  castVoteAction,
  leaveRoomAction,
  startRoundAction,
  submitClueAction,
  toggleReadyAction,
} from "@/lib/actions/imposter";
import type { ImposterRoomSnapshot } from "@/lib/imposter/types";
import { createClient } from "@/lib/supabase/browser";
import { buttonStyles, cn } from "@/lib/utils";

type ImposterRoomClientProps = {
  snapshot: ImposterRoomSnapshot;
};

export function ImposterRoomClient({ snapshot }: ImposterRoomClientProps) {
  const router = useRouter();
  const [clue, setClue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPlayer = snapshot.players.find((player) => player.id === snapshot.currentPlayerId);
  const currentRound = snapshot.currentRound;
  const submittedCount = currentRound?.clues.filter((entry) => entry.hasSubmitted).length ?? 0;
  const everyoneReady =
    snapshot.players.length >= 3 && snapshot.players.every((player) => player.isReady);
  const canStartRound =
    currentPlayer?.isHost &&
    (snapshot.room.status === "lobby" || snapshot.room.status === "results") &&
    everyoneReady;
  const hasSubmittedClue =
    currentRound?.clues.find((entry) => entry.roomPlayerId === snapshot.currentPlayerId)
      ?.hasSubmitted ?? false;
  const hasVoted =
    currentRound?.votes.some((vote) => vote.voterPlayerId === snapshot.currentPlayerId) ?? false;
  const roomPath = `/games/imposter/rooms/${snapshot.room.code}`;
  const roundId = currentRound?.id;

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      startTransition(() => {
        router.refresh();
      });
    };

    const channel = supabase
      .channel(`imposter-room-${snapshot.room.id}`)
      .on(
        "postgres_changes",
        { event: "*", filter: `id=eq.${snapshot.room.id}`, schema: "public", table: "rooms" },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `room_id=eq.${snapshot.room.id}`,
          schema: "public",
          table: "room_players",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `room_id=eq.${snapshot.room.id}`,
          schema: "public",
          table: "rounds",
        },
        refresh,
      );

    if (roundId) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          filter: `round_id=eq.${roundId}`,
          schema: "public",
          table: "votes",
        },
        refresh,
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roundId, router, snapshot.room.id]);

  if (!currentPlayer) {
    return (
      <div className="rounded-[2rem] border border-rose-400/30 bg-rose-500/10 p-6 text-rose-100">
        Your room membership could not be resolved. Try joining the room again from the games page.
      </div>
    );
  }

  async function runAction(task: Promise<{ error?: string; redirectTo?: string; ok?: true }>) {
    const result = await task;

    if (result.error) {
      setFeedback(result.error);
      return;
    }

    setFeedback(null);

    if (result.redirectTo) {
      router.push(result.redirectTo);
      return;
    }

    router.refresh();
  }

  function getPlayerName(playerId: string | null | undefined) {
    if (!playerId) {
      return "Unknown";
    }

    return snapshot.players.find((player) => player.id === playerId)?.displayName ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
                Room {snapshot.room.code}
              </p>
              <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-white">
                Imposter lobby
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Status: <span className="text-white">{snapshot.room.status.replace("_", " ")}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={cn(buttonStyles({ size: "sm", variant: "secondary" }))}
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    runAction(
                      toggleReadyAction({
                        isReady: !currentPlayer.isReady,
                        roomCode: snapshot.room.code,
                      }),
                    ),
                  )
                }
                type="button"
              >
                {currentPlayer.isReady ? "Mark not ready" : "Mark ready"}
              </button>

              <button
                className={cn(buttonStyles({ size: "sm", variant: "ghost" }))}
                disabled={isPending}
                onClick={() =>
                  startTransition(() => runAction(leaveRoomAction({ roomCode: snapshot.room.code })))
                }
                type="button"
              >
                Leave room
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Host</p>
              <p className="mt-2 text-lg text-white">
                {getPlayerName(snapshot.players.find((player) => player.isHost)?.id)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Players</p>
              <p className="mt-2 text-lg text-white">{snapshot.players.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Clues in</p>
              <p className="mt-2 text-lg text-white">
                {submittedCount}/{snapshot.players.length}
              </p>
            </div>
          </div>

          {feedback ? <p className="mt-4 text-sm text-rose-300">{feedback}</p> : null}

          {canStartRound ? (
            <button
              className={cn(buttonStyles(), "mt-6")}
              disabled={isPending}
              onClick={() =>
                startTransition(() => runAction(startRoundAction({ roomCode: snapshot.room.code })))
              }
              type="button"
            >
              {snapshot.room.status === "results" ? "Start next round" : "Start round"}
            </button>
          ) : (
            <p className="mt-6 text-sm text-slate-300">
              The host can start once at least 3 players are in the room and everyone is marked ready.
            </p>
          )}
        </div>

        <aside className="rounded-[2rem] border border-white/15 bg-white/8 p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Players</p>
          <div className="mt-4 space-y-3">
            {snapshot.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/25 px-4 py-3"
              >
                <div>
                  <p className="text-white">
                    {player.displayName}
                    {player.id === snapshot.currentPlayerId ? " (You)" : ""}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {player.isHost ? "Host" : player.isReady ? "Ready" : "Waiting"}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {currentRound ? (
        <section className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">
                Round {currentRound.roundNumber}
              </p>
              <h3 className="mt-2 font-[family:var(--font-display)] text-2xl text-white">
                {currentRound.status === "collecting_clues"
                  ? "Write your clue"
                  : currentRound.status === "voting"
                    ? "Vote for the imposter"
                    : "Round results"}
              </h3>
            </div>
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {roomPath}
            </span>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Private prompt</p>
              <p className="mt-4 text-xl leading-8 text-white">
                {currentRound.privatePrompt ?? "Waiting for your prompt..."}
              </p>
              {currentRound.status === "results" && currentRound.topic ? (
                <p className="mt-4 text-sm text-slate-300">
                  Shared topic was <span className="text-white">{currentRound.topic}</span>.
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              {currentRound.status === "collecting_clues" ? (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">
                    Submit a short clue from your device. Everyone else sees the same topic. The imposter
                    does not.
                  </p>

                  {hasSubmittedClue ? (
                    <p className="mt-5 text-white">
                      Your clue is locked in. Waiting for the rest of the room.
                    </p>
                  ) : (
                    <form
                      className="mt-5 space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        startTransition(() =>
                          runAction(submitClueAction({ clue, roomCode: snapshot.room.code })),
                        );
                      }}
                    >
                      <textarea
                        value={clue}
                        onChange={(event) => setClue(event.target.value)}
                        rows={4}
                        className="w-full rounded-3xl border border-white/15 bg-slate-950/35 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]"
                        placeholder="Type a short clue..."
                      />
                      <button className={cn(buttonStyles())} disabled={isPending} type="submit">
                        Submit clue
                      </button>
                    </form>
                  )}
                </div>
              ) : null}

              {(currentRound.status === "voting" || currentRound.status === "results") && (
                <div className="space-y-3">
                  {currentRound.clues.map((entry) => {
                    const player = snapshot.players.find((item) => item.id === entry.roomPlayerId);
                    const voteCount =
                      currentRound.results.voteCounts?.find(
                        (vote) => vote.targetPlayerId === entry.roomPlayerId,
                      )?.count ?? 0;

                    return (
                      <div
                        key={entry.roomPlayerId}
                        className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                              {player?.displayName ?? "Player"}
                            </p>
                            <p className="mt-2 text-lg text-white">
                              {entry.clue ?? "Clue pending"}
                            </p>
                          </div>

                          {currentRound.status === "voting" ? (
                            <button
                              className={cn(buttonStyles({ size: "sm", variant: "secondary" }))}
                              disabled={
                                isPending ||
                                hasVoted ||
                                entry.roomPlayerId === snapshot.currentPlayerId
                              }
                              onClick={() =>
                                startTransition(() =>
                                  runAction(
                                    castVoteAction({
                                      roomCode: snapshot.room.code,
                                      targetPlayerId: entry.roomPlayerId,
                                    }),
                                  ),
                                )
                              }
                              type="button"
                            >
                              {entry.roomPlayerId === snapshot.currentPlayerId ? "You" : "Vote"}
                            </button>
                          ) : (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                              {voteCount} vote{voteCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentRound.status === "results" ? (
                <div className="rounded-[1.6rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-emerald-200">Results</p>
                  <h4 className="mt-3 text-2xl text-white">
                    {currentRound.results.winningTeam === "crew"
                      ? "Crew wins"
                      : currentRound.results.winningTeam === "imposter"
                        ? "Imposter wins"
                        : "Round draw"}
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    Imposter:{" "}
                    <span className="text-white">{getPlayerName(currentRound.imposterPlayerId)}</span>
                    {currentRound.results.detectedPlayerId ? (
                      <>
                        {" "}
                        / Most votes:{" "}
                        <span className="text-white">
                          {getPlayerName(currentRound.results.detectedPlayerId)}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-slate-300">
            No round is active yet. Ready up, then let the host start the game.
          </p>
        </section>
      )}
    </div>
  );
}
