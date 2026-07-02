import type { SelectHTMLAttributes } from "react";

// Native <select> — mobile browsers open the OS picker, which beats any
// custom dropdown for touch.
export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-11 rounded-xl border border-foreground/20 bg-background px-3 text-base outline-none focus:border-foreground/50 ${className}`}
      {...props}
    />
  );
}
