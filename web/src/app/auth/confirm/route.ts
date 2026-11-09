import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const nextPath = safeNextPath(searchParams.get("next"));

  return NextResponse.redirect(new URL(nextPath, origin));
}
