"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  error?: string;
  success?: string;
};

const profileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(180, "Bio must be 180 characters or fewer.")
    .optional()
    .transform((value) => value || null),
  displayName: z.string().trim().min(2, "Display name is required.").max(40),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/i, "Username should be 3-20 letters, numbers, or underscores.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
});

export async function updateProfileAction(
  _: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser("/account");
  const parsed = profileSchema.safeParse({
    bio: formData.get("bio"),
    displayName: formData.get("displayName"),
    username: formData.get("username"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Could not update your profile.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    bio: parsed.data.bio,
    display_name: parsed.data.displayName,
    id: user.id,
    username: parsed.data.username,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/account");
  revalidatePath("/games/imposter");

  return {
    success: "Profile updated.",
  };
}
