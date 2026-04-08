import { portfolioProjects } from "@/lib/site";

export const metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <section className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Projects</p>
        <h1 className="font-[family:var(--font-display)] text-4xl text-white sm:text-5xl">
          Existing portfolio work, now framed for a proper product surface.
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          The older static portfolio had the right personality. This rebuild keeps that energy, but gives
          the work cleaner structure and room for dynamic features over time.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {portfolioProjects.map((project) => (
          <article
            key={project.title}
            className="rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.8)] p-6"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">{project.kind}</p>
            <h2 className="mt-3 text-2xl text-white">{project.title}</h2>
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
          </article>
        ))}
      </div>
    </div>
  );
}
