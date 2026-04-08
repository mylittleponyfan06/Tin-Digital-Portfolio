"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

export type FormState = {
  error?: string;
  success?: string;
};

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  next: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signUpSchema = signInSchema.extend({
  displayName: z
    .string()
    .trim()
    .max(40, "Display name must be 40 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Could not sign in.",
    };
  }

  const supabase = await createClient();
  const nextPath = safeNextPath(parsed.data.next);
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  redirect(nextPath);
}

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    next: formData.get("next"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Could not sign up.",
    };
  }

  const supabase = await createClient();
  const nextPath = safeNextPath(parsed.data.next);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
      emailRedirectTo: getSiteUrl(
        `/auth/confirm?next=${encodeURIComponent(nextPath)}`,
      ),
    },
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.session) {
    redirect(nextPath);
  }

  return {
    success:
      "Account created. Check your email to confirm the account, then come back and sign in.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect("/");
}
