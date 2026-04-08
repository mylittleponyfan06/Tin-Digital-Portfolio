import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(nextPath = "/account") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  }

  return user;
}
