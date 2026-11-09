"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { sessionCookieName } from "@/lib/auth";
import { createSession, createUser, deleteSession, signInUser } from "@/lib/local-store";
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

  const nextPath = safeNextPath(parsed.data.next);
  const result = await signInUser(parsed.data.email, parsed.data.password);

  if (result.error || !result.user) {
    return {
      error: result.error ?? "Could not sign in.",
    };
  }

  (await cookies()).set(sessionCookieName, await createSession(result.user.id), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

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

  const nextPath = safeNextPath(parsed.data.next);
  const result = await createUser({
    displayName: parsed.data.displayName,
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (result.error || !result.user) {
    return {
      error: result.error ?? "Could not sign up.",
    };
  }

  (await cookies()).set(sessionCookieName, await createSession(result.user.id), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect(nextPath);
}

export async function signOutAction() {
  const cookieStore = await cookies();
  await deleteSession(cookieStore.get(sessionCookieName)?.value);
  cookieStore.delete(sessionCookieName);
  redirect("/");
}
