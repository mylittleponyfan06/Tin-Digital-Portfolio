type AuthErrorPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export const metadata = {
  title: "Auth Error",
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-rose-400/25 bg-rose-500/10 p-6 text-center">
      <p className="text-sm uppercase tracking-[0.24em] text-rose-200">Authentication error</p>
      <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-white">
        We could not finish that sign-in flow.
      </h1>
      <p className="mt-4 text-slate-200">
        {params.message ?? "Try the auth flow again, or check your redirect URLs in Supabase."}
      </p>
    </div>
  );
}
