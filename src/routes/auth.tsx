import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSessionUser } from "@/hooks/useLicenceHub";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Connexion — LicenceHub" },
      {
        name: "description",
        content: "Connectez-vous à LicenceHub ou créez votre compte étudiant pour demander un accès.",
      },
      { property: "og:title", content: "Connexion — LicenceHub" },
      {
        property: "og:description",
        content: "Connectez-vous à LicenceHub ou créez votre compte étudiant.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useSessionUser();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sentConfirm, setSentConfirm] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function signUp() {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/register" },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) setSentConfirm(true);
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("La connexion Google a échoué. Réessayez.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="size-6" />
          <span className="font-display text-lg font-bold">LicenceHub</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-extrabold">
            Les annales de votre filière, prêtes à réviser.
          </h2>
          <p className="mt-4 max-w-md opacity-80">
            SEG, PC, AGRO — Licence 1 à 3. Créez votre compte, un responsable valide votre accès,
            puis tout s'ouvre.
          </p>
        </div>
        <p className="text-sm opacity-70">Accès validé par l'administration</p>
      </div>

      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <GraduationCap className="size-5 text-primary" />
            <span className="font-display font-bold">LicenceHub</span>
          </Link>

          {sentConfirm ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h1 className="text-xl font-bold">Vérifiez votre boîte mail</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Nous avons envoyé un lien de confirmation à {email}. Cliquez dessus pour continuer
                votre inscription.
              </p>
            </div>
          ) : (
            <Tabs defaultValue={mode === "signup" ? "signup" : "signin"}>
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
                  Inscription
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse Gmail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <TabsContent value="signin" className="m-0">
                  <Button className="w-full" disabled={busy} onClick={signIn}>
                    {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Se connecter
                  </Button>
                </TabsContent>
                <TabsContent value="signup" className="m-0">
                  <Button className="w-full" disabled={busy} onClick={signUp}>
                    {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Créer mon compte
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Vous compléterez ensuite vos informations (nom, prénom, WhatsApp, filière).
                  </p>
                </TabsContent>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
                </div>
                <Button variant="outline" className="w-full" onClick={google}>
                  Continuer avec Google
                </Button>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
