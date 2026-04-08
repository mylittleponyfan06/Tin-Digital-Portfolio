import { roadmapPhases, siteConfig, skillGroups } from "@/lib/site";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <section className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">About</p>
        <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-white sm:text-5xl">
          Personal work with a playful edge and serious engineering underneath.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          I like building things that feel intentional, expressive, and technically clean. That includes
          web apps, UI experiments, music-adjacent tools, and anything that lets personality show up in
          the final product.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Based in</p>
            <p className="mt-2 text-lg text-white">{siteConfig.location}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current stack</p>
            <p className="mt-2 text-lg text-white">Next.js, Supabase, TypeScript</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Skill map</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {skillGroups.map((group) => (
              <div key={group.title} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{group.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{group.items.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]">Build plan</p>
          <div className="mt-5 space-y-4">
            {roadmapPhases.map((phase) => (
              <div key={phase.title} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{phase.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{phase.items.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
