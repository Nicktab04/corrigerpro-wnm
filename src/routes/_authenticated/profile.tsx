import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { useIsAdmin, useProfile, useSessionUser } from "@/hooks/useLicenceHub";
import { levelLabel } from "@/lib/licencehub";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [
    { title: "Mon profil — CorrigéPro" },
    { name: "description", content: "Vos informations personnelles et votre compte CorrigéPro." },
    { property: "og:title", content: "Mon profil — CorrigéPro" },
    { property: "og:description", content: "Vos informations personnelles et votre compte CorrigéPro." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSessionUser();
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: roles } = useIsAdmin(user?.id);
  return (
    <AppShell isAdmin={roles?.isAdmin ?? false} subtitle="Mon profil">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-extrabold">Mon profil</h1>
        {isLoading ? <Loader2 className="mt-8 size-5 animate-spin" /> : (
          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Nom et prénom</dt><dd className="mt-1 font-semibold break-words">{profile ? `${profile.nom} ${profile.prenom}` : "Non renseignés"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Gmail</dt><dd className="mt-1 break-all">{user?.email}</dd></div>
            {profile ? <>
              <div><dt className="text-sm text-muted-foreground">WhatsApp</dt><dd className="mt-1">{profile.whatsapp}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Filière et niveau</dt><dd className="mt-1">{profile.major} · {levelLabel(profile.level)}</dd></div>
            </> : null}
          </dl>
        )}
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-lg font-semibold">Suppression du compte</h2>
          <p className="mt-2 mb-5 text-sm text-muted-foreground">La suppression est définitive et entraîne la perte de vos achats et de votre abonnement. Votre Gmail sera disponible pour une nouvelle inscription.</p>
          <DeleteAccountDialog />
        </section>
      </div>
    </AppShell>
  );
}