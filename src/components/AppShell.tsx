import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({
  children,
  isAdmin = false,
  subtitle,
}: {
  children: ReactNode;
  isAdmin?: boolean;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:flex sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display font-bold leading-none">CorrigéPro</span>
              {subtitle ? (
                <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
              ) : null}
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button asChild variant="ghost" size="icon">
              <Link to="/dashboard" aria-label="Annales" title="Annales">
                <BookOpen />
                <span className="sr-only">Annales</span>
              </Link>
            </Button>
            {isAdmin ? (
              <Button asChild variant="ghost" size="icon">
                <Link to="/admin" aria-label="Administration" title="Administration">
                  <ShieldCheck />
                  <span className="sr-only">Administration</span>
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" size="icon" onClick={signOut} aria-label="Quitter" title="Quitter">
              <LogOut />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
