"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/lib/local-store";

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

  await updateProfile(user, {
    bio: parsed.data.bio,
    displayName: parsed.data.displayName,
    username: parsed.data.username,
  });

  revalidatePath("/account");
  revalidatePath("/games/imposter");

  return {
    success: "Profile updated.",
  };
}
