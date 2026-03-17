"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { InstalledSkillsProvider } from "@/lib/installed-skills-context";
import { ToastProvider } from "@/components/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <InstalledSkillsProvider>
        <ToastProvider>{children}</ToastProvider>
      </InstalledSkillsProvider>
    </QueryClientProvider>
  );
}
