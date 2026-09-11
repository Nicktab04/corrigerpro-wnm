import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfile, useSessionUser } from "@/hooks/useLicenceHub";
import { LEVELS, MAJORS, levelLabel, type Major } from "@/lib/licencehub";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({
    meta: [
      { title: "Demande d'accès — LicenceHub" },
      {
        name: "description",
        content: "Complétez vos informations d'étudiant pour demander l'accès aux annales.",
      },
      { property: "og:title", content: "Demande d'accès — LicenceHub" },
      {
        property: "og:description",
        content: "Complétez vos informations d'étudiant pour demander l'accès aux annales.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z.object({
  nom: z.string().trim().min(2, "Nom trop court").max(80),
  prenom: z.string().trim().min(2, "Prénom trop court").max(80),
  gmail: z.string().trim().email("Adresse Gmail invalide").max(255),
  whatsapp: z
    .string()
    .trim()
    .min(6, "Numéro WhatsApp invalide")
    .max(25)
    .regex(/^[0-9+\s-]+$/, "Numéro WhatsApp invalide"),
  major: z.enum(["SEG", "PC", "AGRO"]),
  level: z.number().int().min(1).max(3),
});

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSessionUser();
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: roles } = useIsAdmin(user?.id);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [gmail, setGmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [major, setMajor] = useState<Major | "">("");
  const [level, setLevel] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.email && !gmail) setGmail(user.email);
  }, [user?.email, gmail]);

  // Managers never fill the student form.
  useEffect(() => {
    if (roles?.isAdmin) navigate({ to: "/admin", replace: true });
  }, [roles?.isAdmin, navigate]);

  useEffect(() => {
    if (profile && !roles?.isAdmin) navigate({ to: "/pending", replace: true });
  }, [profile, roles?.isAdmin, navigate]);


  async function submit() {
    const parsed = schema.safeParse({
      nom,
      prenom,
      gmail,
      whatsapp,
      major,
      level: Number(level),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire incomplet");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").insert({ id: user!.id, ...parsed.data });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Demande envoyée");
    navigate({ to: "/pending", replace: true });
  }

  return (
    <AppShell subtitle="Demande d'accès">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-extrabold">Vos informations d'étudiant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un responsable vérifie chaque demande avant d'ouvrir l'accès aux annales.
        </p>

        {isLoading ? (
          <Loader2 className="mt-8 size-5 animate-spin text-muted-foreground" />
        ) : (
          <div className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gmail">Adresse Gmail</Label>
              <Input
                id="gmail"
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Numéro WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                maxLength={25}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Filière</Label>
                <Select value={major} onValueChange={(v) => setMajor(v as Major)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAJORS.map((m) => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.key} — {m.full}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={String(l)}>
                        {levelLabel(l)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Envoyer ma demande
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
