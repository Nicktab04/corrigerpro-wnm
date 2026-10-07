import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { CheckCircle2, Clock, X, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMyPayments, type PaymentRequest } from "@/hooks/usePayments";
import type { DocumentRow } from "@/lib/licencehub";

function message(p: PaymentRequest, title?: string) {
  if (p.status === "approved") {
    return p.kind === "subscription"
      ? "Paiement confirmé : vous êtes passé en mode payant grâce à votre abonnement. Toutes les Corrections et tous les Résumés sont ouverts."
      : `Paiement confirmé : vous pouvez maintenant consulter « ${title ?? "votre document"} ».`;
  }
  return p.kind === "subscription"
    ? "Votre paiement pour l'abonnement a été refusé. Vérifiez votre capture et renvoyez-la."
    : `Votre paiement pour « ${title ?? "ce document"} » a été refusé. Vérifiez votre capture et renvoyez-la.`;
}

export function PaymentNotices({ userId, documents }: { userId: string; documents: Map<string, DocumentRow> }) {
  const queryClient = useQueryClient();
  const { data: payments } = useMyPayments(userId);
  const toasted = useRef(new Set<string>());

  const unseen = (payments ?? []).filter(
    (p) => !p.student_seen && (p.status === "approved" || p.status === "rejected"),
  );
  const pending = (payments ?? []).filter((p) => p.status === "pending");

  useEffect(() => {
    for (const p of unseen) {
      if (toasted.current.has(p.id)) continue;
      toasted.current.add(p.id);
      const text = message(p, p.document_id ? documents.get(p.document_id)?.title : undefined);
      if (p.status === "approved") toast.success(text);
      else toast.error(text);
    }
  }, [unseen, documents]);

  useEffect(() => {
    if (unseen.some((p) => p.status === "approved")) {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["my-unlocks"] });
    }
  }, [unseen.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function dismiss(id: string) {
    await supabase.rpc("mark_payment_seen", { _id: id });
    await queryClient.invalidateQueries({ queryKey: ["my-payments"] });
  }

  if (unseen.length === 0 && pending.length === 0) return null;

  return (
    <div className="mt-6 space-y-2">
      {unseen.map((p) => {
        const ok = p.status === "approved";
        return (
          <div
            key={p.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${ok ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"}`}
          >
            {ok ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            )}
            <p className="flex-1">{message(p, p.document_id ? documents.get(p.document_id)?.title : undefined)}</p>
            <Button size="icon" variant="ghost" className="size-7" onClick={() => dismiss(p.id)} aria-label="Fermer">
              <X className="size-4" />
            </Button>
          </div>
        );
      })}
      {pending.length > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p className="flex-1 text-muted-foreground">
            {pending.length === 1
              ? "1 paiement en attente de confirmation par l'administrateur."
              : `${pending.length} paiements en attente de confirmation par l'administrateur.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
