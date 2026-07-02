import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-background font-semibold active:opacity-80 disabled:opacity-40",
  secondary:
    "border border-foreground/20 bg-transparent text-foreground active:bg-foreground/10 disabled:opacity-40",
  ghost: "bg-transparent text-foreground active:bg-foreground/10 disabled:opacity-40",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-base transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
