import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, LogOut } from "lucide-react";
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span>
              <span className="block font-display font-bold leading-none">LicenceHub</span>
              {subtitle ? (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              ) : null}
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Annales</Link>
            </Button>
            {isAdmin ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">Administration</Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 size-4" /> Quitter
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
