import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getUserByToken } from "@/lib/local-store";
import { safeNextPath } from "@/lib/utils";

export const sessionCookieName = "local_session";

export async function getCurrentUser() {
  return getUserByToken((await cookies()).get(sessionCookieName)?.value);
}

export async function requireUser(nextPath = "/account") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  }

  return user;
}
