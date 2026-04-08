"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, type FormState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: FormState = {};

export function SignInForm({ nextPath }: { nextPath: string }) {
  const [state, action] = useActionState(signInAction, initialState);

  return (
    <form action={action} className="space-y-5 rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.8)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.35)] backdrop-blur">
      <input type="hidden" name="next" value={nextPath} />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-slate-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-12 w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 text-white outline-none transition focus:border-[var(--accent)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm text-slate-200">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="h-12 w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 text-white outline-none transition focus:border-[var(--accent)]"
        />
      </div>

      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}

      <SubmitButton className="w-full" pendingText="Signing in...">
        Sign in
      </SubmitButton>

      <p className="text-sm text-slate-300">
        New here?{" "}
        <Link href={`/auth/sign-up?next=${encodeURIComponent(nextPath)}`} className="text-[var(--accent)]">
          Create an account
        </Link>
      </p>
    </form>
  );
}
