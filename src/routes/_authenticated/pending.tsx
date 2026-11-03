import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Clock, ShieldX } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useIsAdmin, useProfile, useSessionUser } from "@/hooks/useLicenceHub";
import { levelLabel, majorStyle } from "@/lib/licencehub";

export const Route = createFileRoute("/_authenticated/pending")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Statut d’accès — CorrigéPro" },
      { name: "description", content: "Consultez le statut de votre accès aux annales CorrigéPro." },
      { property: "og:title", content: "Statut d’accès — CorrigéPro" },
      {
        property: "og:description",
        content: "Consultez le statut de votre accès aux annales CorrigéPro.",
      },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const navigate = useNavigate();
  const { user } = useSessionUser();
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: roles } = useIsAdmin(user?.id);

  useEffect(() => {
    if (roles?.isAdmin) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    if (!isLoading && !profile) navigate({ to: "/register", replace: true });
    if (profile && profile.status !== "rejected") navigate({ to: "/dashboard", replace: true });
  }, [isLoading, profile, roles?.isAdmin, navigate]);

  const rejected = profile?.status === "rejected";

  if (!rejected) return null;

  return (
    <AppShell subtitle="Statut d’accès">
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center">
        <span
          className={`mx-auto grid size-14 place-items-center rounded-2xl ${rejected ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}
        >
          {rejected ? <ShieldX className="size-6" /> : <Clock className="size-6" />}
        </span>
        <h1 className="mt-5 text-2xl font-extrabold">
          Accès révoqué
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Votre accès a été révoqué par un responsable. Contactez l'administration pour en savoir plus.
        </p>

        {profile ? (
          <div className="mt-6 grid gap-2 rounded-2xl bg-secondary p-4 text-left text-sm">
            <p>
              <span className="text-muted-foreground">Étudiant :</span> {profile.prenom} {profile.nom}
            </p>
            <p>
              <span className="text-muted-foreground">Filière :</span>{" "}
              <span className={majorStyle(profile.major).text}>{profile.major}</span> —{" "}
              {levelLabel(profile.level)}
            </p>
            <p>
              <span className="text-muted-foreground">WhatsApp :</span> {profile.whatsapp}
            </p>
          </div>
        ) : null}

        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </AppShell>
  );
}
