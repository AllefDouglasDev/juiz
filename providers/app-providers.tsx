"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { SyncProvider } from "./sync-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  // Data lives in localStorage, so it never goes stale behind our back.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SyncProvider>{children}</SyncProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
