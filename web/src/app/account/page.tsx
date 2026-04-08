import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const user = await requireUser("/account");
  const supabase = await createClient();

  const [{ data: profile }, { data: leaderboard }] = await Promise.all([
    supabase
      .from("profiles")
      .select("bio, created_at, display_name, username")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("leaderboard_entries")
      .select("crew_wins, imposter_wins, rounds_played, wins")
      .eq("game_slug", "imposter")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
      <section className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Dashboard</p>
        <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-white">
          {profile?.display_name ?? user.email}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Signed in as {user.email}. Account created {formatDate(profile?.created_at)}.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wins</p>
            <p className="mt-2 text-2xl text-white">{leaderboard?.wins ?? 0}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rounds played</p>
            <p className="mt-2 text-2xl text-white">{leaderboard?.rounds_played ?? 0}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Crew wins</p>
            <p className="mt-2 text-2xl text-white">{leaderboard?.crew_wins ?? 0}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Imposter wins</p>
            <p className="mt-2 text-2xl text-white">{leaderboard?.imposter_wins ?? 0}</p>
          </div>
        </div>
      </section>

      <ProfileForm
        bio={profile?.bio}
        displayName={profile?.display_name}
        username={profile?.username}
      />
    </div>
  );
}
