"use client";

import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "unstyled";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-sm hover:bg-blue-600 disabled:bg-[var(--border)]",
  secondary:
    "border border-[var(--accent)] text-[var(--accent)] bg-white hover:bg-[var(--accent-muted)] disabled:border-[var(--border)] disabled:text-foreground-muted",
  ghost:
    "text-[var(--accent)] hover:bg-[var(--accent-muted)] disabled:text-foreground-muted",
  danger:
    "bg-[var(--danger)] text-white shadow-sm hover:bg-red-600 disabled:bg-[var(--border)]",
  unstyled: "",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm rounded-xl",
  md: "px-4 py-2.5 text-sm rounded-full",
  lg: "px-6 py-3 text-base rounded-full",
};

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]",
        variantStyles[variant],
        sizeStyles[size],
        loading && "cursor-wait opacity-80",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

