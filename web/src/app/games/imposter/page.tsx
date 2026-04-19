import Link from "next/link";

import { ImposterEntryForms } from "@/components/games/imposter/imposter-entry-forms";
import { getCurrentUser } from "@/lib/auth";
import { getImposterLeaderboard } from "@/lib/imposter/queries";
import { createClient } from "@/lib/supabase/server";
import { buttonStyles, cn } from "@/lib/utils";

export const metadata = {
  title: "Imposter",
};

export default async function ImposterPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const profile = user
    ? await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
    : null;
  const leaderboard = user ? await getImposterLeaderboard(8) : [];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Game 01</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-white sm:text-5xl">
            Imposter
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            A Jackbox-style party game. One player is secretly the imposter. Everyone else gets the same
            topic, submits one clue, then votes from their own device.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Host creates room", "Players join by code", "Realtime clue and vote flow"].map((item) => (
              <div
                key={item}
                className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">MVP scope</p>
          <div className="mt-5 space-y-3">
            {[
              "Short room code generation",
              "Lobby readiness",
              "Secure round start and imposter assignment",
              "Prompt submission",
              "Voting",
              "Leaderboard updates",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {user ? (
        <ImposterEntryForms defaultDisplayName={profile?.data?.display_name ?? user.email ?? ""} />
      ) : (
        <section className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-lg leading-8 text-slate-300">
            Sign in first so rooms, prompts, and leaderboard entries can stay tied to your account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth/sign-in?next=%2Fgames%2Fimposter" className={cn(buttonStyles())}>
              Sign in
            </Link>
            <Link
              href="/auth/sign-up?next=%2Fgames%2Fimposter"
              className={cn(buttonStyles({ variant: "secondary" }))}
            >
              Create account
            </Link>
          </div>
        </section>
      )}

      {user ? (
        <section className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Leaderboard</p>
          <div className="mt-5 grid gap-3">
            {leaderboard.length ? (
              leaderboard.map((entry, index) => (
                <div
                  key={`${entry.display_name}-${index}`}
                  className="grid grid-cols-[auto,1fr,auto] items-center gap-4 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-400">#{index + 1}</span>
                  <div>
                    <p className="text-white">{entry.display_name}</p>
                    <p className="text-sm text-slate-300">
                      {entry.rounds_played} rounds / {entry.crew_wins} crew wins /{" "}
                      {entry.imposter_wins} imposter wins
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">
                    {entry.wins} wins
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-300">Leaderboard is empty. Start the first room and seed it.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
