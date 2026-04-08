import Link from "next/link";

import { roadmapPhases, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 text-sm text-slate-300 sm:px-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <p className="font-[family:var(--font-display)] text-xl text-white">{siteConfig.name}</p>
          <p className="max-w-2xl leading-7 text-slate-300/90">{siteConfig.tagline}</p>
          <p className="text-slate-400">
            Built for Vercel + Supabase first. Home-server integrations stay optional and come later.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {roadmapPhases.map((phase) => (
            <div key={phase.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">{phase.title}</p>
              <p className="mt-2 leading-6 text-slate-300">{phase.items.slice(0, 3).join(" · ")}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <Link href="/projects" className="text-slate-300 transition hover:text-white">
            Projects
          </Link>
          <Link href="/games" className="text-slate-300 transition hover:text-white">
            Games
          </Link>
          <Link href="/about" className="text-slate-300 transition hover:text-white">
            About
          </Link>
          <a href={`mailto:${siteConfig.email}`} className="text-slate-300 transition hover:text-white">
            {siteConfig.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
