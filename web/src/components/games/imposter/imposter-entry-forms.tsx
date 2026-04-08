"use client";

import { useActionState } from "react";

import { createRoomAction, joinRoomAction, type RoomFormState } from "@/lib/actions/imposter";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: RoomFormState = {};

export function ImposterEntryForms({
  defaultDisplayName,
}: {
  defaultDisplayName?: string | null;
}) {
  const [createState, createAction] = useActionState(createRoomAction, initialState);
  const [joinState, joinAction] = useActionState(joinRoomAction, initialState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        action={createAction}
        className="space-y-5 rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.8)] p-6"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Host</p>
          <h3 className="mt-2 font-[family:var(--font-display)] text-2xl text-white">
            Create a room
          </h3>
        </div>

        <input
          name="displayName"
          type="text"
          placeholder="Display name in room"
          defaultValue={defaultDisplayName ?? ""}
          className="h-12 w-full rounded-2xl border border-white/15 bg-slate-950/35 px-4 text-white outline-none transition focus:border-[var(--accent)]"
        />

        {createState.error ? <p className="text-sm text-rose-300">{createState.error}</p> : null}

        <SubmitButton className="w-full" pendingText="Creating room...">
          Create Imposter room
        </SubmitButton>
      </form>

      <form
        action={joinAction}
        className="space-y-5 rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.8)] p-6"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">Guest</p>
          <h3 className="mt-2 font-[family:var(--font-display)] text-2xl text-white">
            Join by room code
          </h3>
        </div>

        <input
          name="roomCode"
          type="text"
          placeholder="AB12CD"
          autoCapitalize="characters"
          className="h-12 w-full rounded-2xl border border-white/15 bg-slate-950/35 px-4 text-white uppercase outline-none transition focus:border-[var(--accent)]"
        />

        <input
          name="displayName"
          type="text"
          placeholder="Display name in room"
          defaultValue={defaultDisplayName ?? ""}
          className="h-12 w-full rounded-2xl border border-white/15 bg-slate-950/35 px-4 text-white outline-none transition focus:border-[var(--accent)]"
        />

        {joinState.error ? <p className="text-sm text-rose-300">{joinState.error}</p> : null}

        <SubmitButton className="w-full" pendingText="Joining room...">
          Join room
        </SubmitButton>
      </form>
    </div>
  );
}
