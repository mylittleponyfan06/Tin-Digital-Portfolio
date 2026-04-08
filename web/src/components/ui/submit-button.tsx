"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { buttonStyles, cn } from "@/lib/utils";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  className,
  pendingText = "Working...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      className={cn(buttonStyles(), className)}
      disabled={pending || props.disabled}
      type={props.type ?? "submit"}
    >
      {pending ? pendingText : children}
    </button>
  );
}
