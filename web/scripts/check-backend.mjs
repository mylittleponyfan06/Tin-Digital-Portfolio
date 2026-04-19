import fs from "node:fs";
import path from "node:path";

class CheckBackendError extends Error {}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

function readEnv() {
  const localEnv = loadDotEnv(path.resolve(".env.local"));

  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || localEnv.NEXT_PUBLIC_SITE_URL || "",
    supabaseKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL || "",
  };
}

function fail(message) {
  throw new CheckBackendError(message);
}

function warn(message) {
  console.warn(`WARN: ${message}`);
}

function info(message) {
  console.log(`INFO: ${message}`);
}

async function main() {
  const env = readEnv();

  if (!env.siteUrl) {
    warn("NEXT_PUBLIC_SITE_URL is missing.");
  } else {
    info(`Site URL: ${env.siteUrl}`);
  }

  if (!env.supabaseUrl) {
    fail("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (!env.supabaseKey) {
    fail("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(env.supabaseUrl);
  } catch {
    fail("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  info(`Supabase host: ${parsedUrl.host}`);

  if (parsedUrl.pathname !== "/" && parsedUrl.pathname !== "") {
    warn(
      `Supabase URL contains a path (${parsedUrl.pathname}). Expected the project API root, usually https://<project-ref>.supabase.co.`,
    );
  }

  const response = await fetch(new URL("/rest/v1/", parsedUrl), {
    headers: {
      apikey: env.supabaseKey,
      Authorization: `Bearer ${env.supabaseKey}`,
    },
  }).catch((error) => {
    fail(`Network request to Supabase failed: ${error.message}`);
  });

  const contentType = response.headers.get("content-type") || "unknown";
  const bodyText = (await response.text()).slice(0, 160).replace(/\s+/g, " ");

  info(`REST status: ${response.status}`);
  info(`REST content-type: ${contentType}`);

  if (response.ok) {
    info("Supabase REST endpoint is reachable.");
    return;
  }

  if (response.status === 401 || response.status === 403) {
    info("Supabase REST endpoint is reachable, but the request is unauthenticated or blocked by policy. That is acceptable for this smoke test.");
    return;
  }

  if (contentType.includes("text/html")) {
    fail(
      `Supabase URL returned HTML instead of the REST API. Double-check that NEXT_PUBLIC_SUPABASE_URL is your project API URL from Supabase Settings > API. Response preview: ${bodyText}`,
    );
  }

  fail(`Unexpected Supabase response. Preview: ${bodyText}`);
}

try {
  await main();
} catch (error) {
  if (error instanceof CheckBackendError) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.error(
      `ERROR: ${error instanceof Error ? error.message : "Unexpected backend check failure."}`,
    );
    process.exitCode = 1;
  }
}
