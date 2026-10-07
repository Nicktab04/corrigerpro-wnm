import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Image as ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa } from "@/hooks/useLicenceHub";
import { PAYMENT_STATUS_LABELS, type PaymentRequest } from "@/hooks/usePayments";

export function usePaymentRequestsAdmin(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-payments"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .neq("status", "awaiting_proof")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as PaymentRequest[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const docIds = [...new Set(rows.map((r) => r.document_id).filter(Boolean) as string[])];
      const [{ data: profiles }, { data: docs }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("id, nom, prenom, gmail").in("id", userIds)
          : Promise.resolve({ data: [] as { id: string; nom: string; prenom: string; gmail: string }[] }),
        docIds.length
          ? supabase.from("documents").select("id, title").in("id", docIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const dMap = new Map((docs ?? []).map((d) => [d.id, d.title]));
      return rows.map((r) => ({
        ...r,
        student: pMap.get(r.user_id),
        documentTitle: r.document_id ? dMap.get(r.document_id) : undefined,
      }));
    },
  });
}

export function PaymentRequestsAdmin({ statusFilter }: { statusFilter: "pending" | "done" }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = usePaymentRequestsAdmin(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const rows = (data ?? []).filter((r) =>
    statusFilter === "pending" ? r.status === "pending" : r.status === "approved" || r.status === "rejected",
  );

  async function showProof(path: string) {
    const { data: signed, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
    if (error || !signed) {
      toast.error("Capture introuvable");
      return;
    }
    setProofUrl(signed.signedUrl);
  }

  async function review(id: string, approve: boolean) {
    setBusyId(id);
    const { error } = await supabase.rpc("review_payment", { _id: id, _approve: approve });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success(approve ? "Paiement confirmé, accès ouvert" : "Paiement refusé");
  }

  if (isLoading) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  if (rows.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {statusFilter === "pending" ? "Aucun paiement à vérifier." : "Aucun paiement traité."}
      </div>
    );

  return (
    <>
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="min-w-52">
            <p className="font-semibold">
              {r.student ? `${r.student.prenom} ${r.student.nom}` : "Étudiant"}
            </p>
            {r.student ? <p className="text-sm text-muted-foreground">{r.student.gmail}</p> : null}
            <p className="mt-1 text-sm">
              {r.kind === "subscription" ? "Abonnement 1 mois" : (r.documentTitle ?? "Document supprimé")} —{" "}
              <span className="font-semibold">{formatFcfa(r.amount)}</span>
            </p>
            <p className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString("fr-FR")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
              {PAYMENT_STATUS_LABELS[r.status]}
            </Badge>
            {r.screenshot_path ? (
              <Button size="sm" variant="outline" onClick={() => showProof(r.screenshot_path!)}>
                <ImageIcon className="mr-1.5 size-4" /> Voir la capture
              </Button>
            ) : null}
            {r.status === "pending" ? (
              <>
                <Button size="sm" onClick={() => review(r.id, true)} disabled={busyId === r.id}>
                  <Check className="mr-1.5 size-4" /> Confirmer
                </Button>
                <Button size="sm" variant="outline" onClick={() => review(r.id, false)} disabled={busyId === r.id}>
                  <X className="mr-1.5 size-4" /> Refuser
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ))}
      <Dialog open={Boolean(proofUrl)} onOpenChange={(o) => !o && setProofUrl(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Capture du paiement</DialogTitle>
          </DialogHeader>
          {proofUrl ? <img src={proofUrl} alt="Capture du paiement Wave" className="h-auto w-full rounded-xl" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
