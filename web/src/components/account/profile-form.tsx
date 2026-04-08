"use client";

import { useActionState } from "react";

import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: ProfileFormState = {};

type ProfileFormProps = {
  bio?: string | null;
  displayName?: string | null;
  username?: string | null;
};

export function ProfileForm({ bio, displayName, username }: ProfileFormProps) {
  const [state, action] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="space-y-5 rounded-[2rem] border border-white/15 bg-white/8 p-6">
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm text-slate-200">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          defaultValue={displayName ?? ""}
          className="h-12 w-full rounded-2xl border border-white/15 bg-slate-950/35 px-4 text-white outline-none transition focus:border-[var(--accent)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm text-slate-200">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          defaultValue={username ?? ""}
          className="h-12 w-full rounded-2xl border border-white/15 bg-slate-950/35 px-4 text-white outline-none transition focus:border-[var(--accent)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm text-slate-200">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={bio ?? ""}
          className="w-full rounded-2xl border border-white/15 bg-slate-950/35 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]"
        />
      </div>

      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}

      <SubmitButton pendingText="Saving profile...">Save profile</SubmitButton>
    </form>
  );
}
