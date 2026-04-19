export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const normalizedKey = key?.trim();

  if (!url || !normalizedKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { key: normalizedKey, url };
}

export function getSiteUrl(path = "") {
  let base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
    process.env.VERCEL_URL?.trim() ??
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ??
    "http://localhost:3000";

  if (!base.startsWith("http")) {
    base = `https://${base}`;
  }

  if (!base.endsWith("/")) {
    base = `${base}/`;
  }

  if (!path) {
    return base;
  }

  return new URL(path.replace(/^\//, ""), base).toString();
}
