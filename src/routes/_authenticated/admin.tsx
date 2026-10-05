import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Check, Loader2, ShieldOff, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { UploadDocumentDialog } from "@/components/UploadDocumentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSessionUser } from "@/hooks/useLicenceHub";
import { levelLabel, majorStyle, type AccessStatus, type Profile } from "@/lib/licencehub";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — CorrigéPro" },
      {
        name: "description",
        content: "Validez les demandes d'accès, gérez les droits de dépôt et publiez des annales.",
      },
      { property: "og:title", content: "Administration — CorrigéPro" },
      {
        property: "og:description",
        content: "Validez les demandes d'accès, gérez les droits de dépôt et publiez des annales.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSessionUser();
  const { data: roles, isLoading: rolesLoading } = useIsAdmin(user?.id);
  const isAdmin = roles?.isAdmin ?? false;

  useEffect(() => {
    if (!rolesLoading && user && !isAdmin) navigate({ to: "/dashboard", replace: true });
  }, [rolesLoading, isAdmin, user, navigate]);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const { data: uploaders } = useQuery({
    queryKey: ["admin-uploaders"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return new Set((data ?? []).filter((r) => r.role === "uploader").map((r) => r.user_id));
    },
  });

  async function setStatus(id: string, status: AccessStatus) {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success(status === "approved" ? "Accès accordé" : "Demande refusée");
  }

  async function setPlan(id: string, plan: "free" | "paid") {
    const { error } = await supabase.from("profiles").update({ plan }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success(plan === "paid" ? "Statut payant activé" : "Statut gratuit");
  }

  async function toggleUploader(id: string, enabled: boolean) {
    const { error } = enabled
      ? await supabase.from("user_roles").insert({ user_id: id, role: "uploader" })
      : await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "uploader");
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-uploaders"] });
    toast.success(enabled ? "Droit de dépôt accordé" : "Droit de dépôt retiré");
  }

  const pending = (profiles ?? []).filter((p) => p.status === "pending");
  const approved = (profiles ?? []).filter((p) => p.status === "approved");
  const rejected = (profiles ?? []).filter((p) => p.status === "rejected");

  return (
    <AppShell isAdmin subtitle="Administration">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Administration</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Validez les demandes d'accès, accordez le droit de dépôt et publiez de nouvelles annales.
          </p>
        </div>
        {user ? <UploadDocumentDialog userId={user.id} /> : null}
      </div>

      {isLoading ? (
        <Loader2 className="mt-10 size-5 animate-spin text-muted-foreground" />
      ) : (
        <Tabs defaultValue="pending" className="mt-8">
          <TabsList>
            <TabsTrigger value="pending">Demandes ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Étudiants validés ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Refusées ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-3">
            {pending.length === 0 ? (
              <EmptyRow text="Aucune demande en attente." />
            ) : (
              pending.map((p) => (
                <StudentRow key={p.id} profile={p}>
                  <Button size="sm" onClick={() => setStatus(p.id, "approved")}>
                    <Check className="mr-1.5 size-4" /> Approuver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "rejected")}>
                    <X className="mr-1.5 size-4" /> Refuser
                  </Button>
                </StudentRow>
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6 space-y-3">
            {approved.length === 0 ? (
              <EmptyRow text="Aucun étudiant validé pour le moment." />
            ) : (
              approved.map((p) => (
                <StudentRow key={p.id} profile={p}>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={uploaders?.has(p.id) ?? false}
                      onCheckedChange={(v) => toggleUploader(p.id, v)}
                    />
                    {uploaders?.has(p.id) ? (
                      <span className="flex items-center gap-1 text-foreground">
                        <ShieldCheck className="size-3.5 text-success" /> Peut déposer
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ShieldOff className="size-3.5" /> Dépôt désactivé
                      </span>
                    )}
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={p.plan === "paid"}
                      onCheckedChange={(v) => setPlan(p.id, v ? "paid" : "free")}
                    />
                    <span className={p.plan === "paid" ? "text-foreground" : ""}>
                      {p.plan === "paid" ? "Payant" : "Gratuit"}
                    </span>
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(p.id, "rejected")}>
                    Révoquer l'accès
                  </Button>
                </StudentRow>
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6 space-y-3">
            {rejected.length === 0 ? (
              <EmptyRow text="Aucune demande refusée." />
            ) : (
              rejected.map((p) => (
                <StudentRow key={p.id} profile={p}>
                  <Button size="sm" onClick={() => setStatus(p.id, "approved")}>
                    <Check className="mr-1.5 size-4" /> Accorder l'accès
                  </Button>
                </StudentRow>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function StudentRow({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const style = majorStyle(profile.major);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-52">
        <p className="font-semibold">
          {profile.prenom} {profile.nom}
        </p>
        <p className="text-sm text-muted-foreground">{profile.gmail}</p>
        <p className="text-sm text-muted-foreground">WhatsApp : {profile.whatsapp}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={`${style.bg} text-white`}>{profile.major}</Badge>
        <Badge variant="secondary">{levelLabel(profile.level)}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
