import Link from "next/link";

import { signOutAction } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { navigationItems, siteConfig } from "@/lib/site";
import { buttonStyles, cn } from "@/lib/utils";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-[rgba(14,20,35,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <Link href="/" className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
            {siteConfig.domain}
          </span>
          <span className="font-[family:var(--font-display)] text-lg text-white">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/account" className={cn(buttonStyles({ size: "sm", variant: "secondary" }))}>
                Account
              </Link>
              <form action={signOutAction}>
                <button className={cn(buttonStyles({ size: "sm", variant: "ghost" }))} type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white">
                Sign in
              </Link>
              <Link href="/auth/sign-up" className={cn(buttonStyles({ size: "sm" }))}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
