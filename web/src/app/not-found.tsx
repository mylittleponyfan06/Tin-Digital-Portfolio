import Link from "next/link";

import { buttonStyles, cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/15 bg-[rgba(13,18,31,0.82)] p-8 text-center">
      <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">404</p>
      <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-white">Page not found</h1>
      <p className="mt-4 text-slate-300">
        That route is missing, moved, or still waiting to be built into the app shell.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className={cn(buttonStyles())}>
          Home
        </Link>
        <Link href="/games" className={cn(buttonStyles({ variant: "secondary" }))}>
          Games
        </Link>
      </div>
    </div>
  );
}
