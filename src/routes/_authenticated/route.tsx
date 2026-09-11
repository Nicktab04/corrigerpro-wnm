import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useSessionUser } from "@/hooks/useLicenceHub";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

// The session only exists in the browser, so the gate runs after mount instead
// of redirecting in beforeLoad — a server-side redirect made React hydrate the
// sign-in page into markup rendered for the protected route (blank screen).
function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { user, loading } = useSessionUser();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Outlet />;
}
