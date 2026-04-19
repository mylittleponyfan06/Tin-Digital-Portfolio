import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { featuredProjects, roadmapPhases, siteConfig, skillGroups } from "@/lib/site";
import { buttonStyles, cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-20">
      <section className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">
              Portfolio first. App-ready by design.
            </p>
            <h1 className="max-w-4xl font-[family:var(--font-display)] text-5xl leading-none text-white sm:text-6xl">
              {siteConfig.name} is evolving from a static portfolio into a personal game platform.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              The portfolio stays the front door. Behind it sits a clean Next.js + Supabase stack for
              realtime multiplayer games, private tools, and future friend features.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/projects" className={cn(buttonStyles())}>
              Browse projects
            </Link>
            <Link href="/games/imposter" className={cn(buttonStyles({ variant: "secondary" }))}>
              Explore games
            </Link>
            <Link
              href={user ? "/account" : "/auth/sign-up"}
              className={cn(buttonStyles({ variant: "ghost" }))}
            >
              {user ? "Open account" : "Create account"}
            </Link>
          </div>
        </div>

        <div className="panel-grid rounded-[2.5rem] border border-white/15 bg-[rgba(13,18,31,0.8)] p-7 shadow-[0_30px_90px_rgba(8,12,23,0.45)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Stack</p>
              <p className="mt-3 text-2xl text-white">Next.js 16 + Supabase</p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Deploy</p>
              <p className="mt-3 text-2xl text-white">Vercel-first MVP</p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Now shipping</p>
              <p className="mt-3 text-lg leading-8 text-slate-200">
                Portfolio shell, auth, account area, games landing page, and the first realtime party
                game: Imposter.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Featured</p>
          <h2 className="mt-2 font-[family:var(--font-display)] text-3xl text-white sm:text-4xl">
            Portfolio and app work can live in the same product.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <article
              key={project.title}
              className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.75)] p-6"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                {project.kind}
              </p>
              <h3 className="mt-3 text-2xl text-white">{project.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{project.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={project.href} className="mt-6 inline-flex text-sm text-[var(--accent)]">
                {project.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.75)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Focus areas</p>
          <div className="mt-5 space-y-5">
            {skillGroups.map((group) => (
              <div key={group.title}>
                <p className="font-medium text-white">{group.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{group.items.join(" / ")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.75)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Phased rollout</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {roadmapPhases.map((phase) => (
              <div key={phase.title} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{phase.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{phase.items.join(" / ")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
