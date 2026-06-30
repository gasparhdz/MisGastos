import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-5 sm:px-6 sm:pb-32 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
