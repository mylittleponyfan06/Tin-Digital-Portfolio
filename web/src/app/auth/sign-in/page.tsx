import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

type SignInPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const metadata = {
  title: "Sign In",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/account");
  }

  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Auth</p>
        <h1 className="font-[family:var(--font-display)] text-4xl text-white">Sign in</h1>
        <p className="text-slate-300">
          Access your account, game rooms, and leaderboard progress.
        </p>
      </div>
      <SignInForm nextPath={nextPath} />
    </div>
  );
}
