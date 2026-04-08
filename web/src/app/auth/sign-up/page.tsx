import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

type SignUpPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const metadata = {
  title: "Sign Up",
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
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
        <h1 className="font-[family:var(--font-display)] text-4xl text-white">Create account</h1>
        <p className="text-slate-300">
          Set up a profile so rooms, wins, and future friends features can follow you.
        </p>
      </div>
      <SignUpForm nextPath={nextPath} />
    </div>
  );
}
