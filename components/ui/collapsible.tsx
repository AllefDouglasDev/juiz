import type { ReactNode } from "react";

interface CollapsibleProps {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

// Native <details>/<summary>: zero-JS collapsible.
export function Collapsible({
  summary,
  children,
  defaultOpen = false,
}: CollapsibleProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-foreground/10"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 [&::-webkit-details-marker]:hidden">
        {summary}
        <span
          aria-hidden
          className="text-foreground/50 transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-foreground/10 p-3">{children}</div>
    </details>
  );
}
