import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getImposterLeaderboard } from "@/lib/imposter/queries";
import { buttonStyles, cn } from "@/lib/utils";

export const metadata = {
  title: "Games",
};

export default async function GamesPage() {
  const user = await getCurrentUser();
  const leaderboard = user ? await getImposterLeaderboard(6) : [];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr,0.95fr]">
        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Games</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-white sm:text-5xl">
            A portfolio-first arcade for small-group browser games.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            The first game is Imposter: a social bluffing round built for private rooms, short prompts,
            votes, and realtime feedback. Everything runs on Vercel + Supabase for the initial MVP.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/games/imposter" className={cn(buttonStyles())}>
              Open Imposter
            </Link>
            <Link
              href={user ? "/account" : "/auth/sign-in?next=%2Fgames%2Fimposter"}
              className={cn(buttonStyles({ variant: "secondary" }))}
            >
              {user ? "Go to account" : "Sign in to play"}
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Platform goals</p>
          <div className="mt-5 grid gap-4">
            {[
              "Fast MVP delivery with clean app structure.",
              "Secure room actions and prompt assignment on the server side.",
              "Supabase Realtime for lobby and round updates.",
              "Room to grow into more games, friends, and private tools later.",
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {user ? (
        <section className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Leaderboard</p>
              <h2 className="mt-2 text-3xl text-white">Current Imposter standings</h2>
            </div>
            <Link href="/games/imposter" className="text-sm text-[var(--accent)]">
              Launch game
            </Link>
          </div>
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
                      {entry.rounds_played} rounds · {entry.crew_wins} crew wins · {entry.imposter_wins} imposter wins
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-100">
                    {entry.wins} wins
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-300">No leaderboard entries yet. Start the first room.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
