export function getSiteUrl(path = "") {
  let base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "https://www.qwiosky.lol/";

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
