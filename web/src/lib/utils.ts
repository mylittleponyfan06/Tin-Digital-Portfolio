import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function normalizeRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function safeNextPath(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function buttonStyles({
  size = "md",
  variant = "primary",
}: {
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "ghost";
} = {}) {
  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  const sizes = {
    md: "h-11 px-5 text-sm sm:text-base",
    sm: "h-10 px-4 text-sm",
  };

  const variants = {
    ghost:
      "border border-white/20 bg-slate-950/10 text-slate-100 hover:bg-slate-950/20",
    primary:
      "bg-[var(--accent)] text-slate-950 shadow-[0_16px_40px_rgba(244,166,96,0.22)] hover:bg-[var(--accent-strong)]",
    secondary:
      "border border-white/60 bg-white/70 text-slate-900 hover:bg-white",
  };

  return cn(base, sizes[size], variants[variant]);
}
