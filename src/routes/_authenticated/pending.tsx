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
      { title: "Demande en attente — LicenceHub" },
      { name: "description", content: "Votre demande d'accès aux annales est en cours de validation." },
      { property: "og:title", content: "Demande en attente — LicenceHub" },
      {
        property: "og:description",
        content: "Votre demande d'accès aux annales est en cours de validation.",
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
    if (profile?.status === "approved") navigate({ to: "/dashboard", replace: true });
  }, [isLoading, profile, roles?.isAdmin, navigate]);

  const rejected = profile?.status === "rejected";

  return (
    <AppShell subtitle="Statut de la demande">
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center">
        <span
          className={`mx-auto grid size-14 place-items-center rounded-2xl ${rejected ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}
        >
          {rejected ? <ShieldX className="size-6" /> : <Clock className="size-6" />}
        </span>
        <h1 className="mt-5 text-2xl font-extrabold">
          {rejected ? "Demande refusée" : "Demande en attente de validation"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {rejected
            ? "Un responsable n'a pas validé votre demande. Contactez l'administration de votre filière pour en savoir plus."
            : "Un responsable examine votre demande. Vous verrez les annales dès qu'elle sera acceptée — revenez sur cette page pour vérifier."}
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
