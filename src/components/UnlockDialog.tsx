import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, Crown, FileLock2, Loader2, Lock, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, usePricing, useSessionUser } from "@/hooks/useLicenceHub";
import {
  WAVE_PAYMENT_URL,
  openRequestFor,
  useMyPayments,
  type PaymentKind,
  type PaymentRequest,
} from "@/hooks/usePayments";
import type { DocumentRow } from "@/lib/licencehub";

export function useDocumentPrice(doc: DocumentRow | null) {
  const { data: pricing } = usePricing();
  if (doc?.price != null) return doc.price;
  return pricing?.unit_price;
}

export function UnlockButton({
  document,
  onClick,
  label = "Débloquer",
}: {
  document: DocumentRow;
  onClick: () => void;
  label?: string;
}) {
  const price = useDocumentPrice(document);
  const { user } = useSessionUser();
  const { data: payments } = useMyPayments(user?.id);
  const open = openRequestFor(payments, { kind: "document", documentId: document.id });
  if (open?.status === "pending") {
    return (
      <Button size="sm" variant="secondary" onClick={onClick}>
        <Clock className="mr-1.5 size-4" /> En attente de confirmation
      </Button>
    );
  }
  return (
    <Button size="sm" onClick={onClick}>
      <Lock className="mr-1.5 size-4" /> {label}
      {price != null ? ` – ${formatFcfa(price)}` : ""}
    </Button>
  );
}

export function UnlockDialog({
  document,
  onOpenChange,
}: {
  document: DocumentRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useSessionUser();
  const { data: pricing } = usePricing();
  const { data: payments } = useMyPayments(user?.id);
  const price = useDocumentPrice(document);
  const [activeId, setActiveId] = useState<string | null>(null);

  const docRequest = document ? openRequestFor(payments, { kind: "document", documentId: document.id }) : undefined;
  const subRequest = openRequestFor(payments, { kind: "subscription" });
  const active =
    (activeId && payments?.find((p) => p.id === activeId)) || docRequest || subRequest || null;

  async function pay(kind: PaymentKind) {
    if (!user || !document) return;
    // Onglet ouvert pendant le clic pour éviter le blocage des pop-ups.
    const tab = window.open(WAVE_PAYMENT_URL, "_blank", "noopener,noreferrer");
    const existing = kind === "document" ? docRequest : subRequest;
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const amount = kind === "document" ? (price ?? 0) : (pricing?.subscription_price ?? 0);
    const { data, error } = await supabase
      .from("payment_requests")
      .insert({
        user_id: user.id,
        kind,
        document_id: kind === "document" ? document.id : null,
        amount,
      })
      .select("id")
      .single();
    if (error) {
      tab?.close();
      toast.error(error.message);
      return;
    }
    setActiveId(data.id);
    await queryClient.invalidateQueries({ queryKey: ["my-payments"] });
    if (!tab) window.location.href = WAVE_PAYMENT_URL;
  }

  return (
    <Dialog
      open={Boolean(document)}
      onOpenChange={(o) => {
        if (!o) setActiveId(null);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Débloquer ce contenu</DialogTitle>
          <DialogDescription>{document?.title}</DialogDescription>
        </DialogHeader>
        {active ? (
          <ProofStep request={active} documentTitle={document?.title} />
        ) : (
          <>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => pay("document")}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
              >
                <FileLock2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="flex-1">
                  <span className="block font-semibold">Débloquer ce document</span>
                  <span className="block text-sm text-muted-foreground">
                    Accès à ce document, acquis pour toujours.
                  </span>
                </span>
                <span className="font-bold">{price != null ? formatFcfa(price) : "…"}</span>
              </button>
              <button
                type="button"
                onClick={() => pay("subscription")}
                className="flex items-start gap-3 rounded-2xl border-2 border-primary bg-card p-4 text-left transition-colors hover:bg-muted"
              >
                <Crown className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="flex-1">
                  <span className="block font-semibold">Abonnement 1 mois</span>
                  <span className="block text-sm text-muted-foreground">
                    Accès à toutes les Corrections et tous les Résumés pendant 1 mois.
                  </span>
                </span>
                <span className="font-bold">
                  {pricing ? `${formatFcfa(pricing.subscription_price)} / mois` : "…"}
                </span>
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Vous serez redirigé vers Wave pour payer. Revenez ensuite ici pour envoyer la capture
              de votre paiement.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProofStep({ request, documentTitle }: { request: PaymentRequest; documentTitle?: string | undefined }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const what = request.kind === "subscription" ? "Abonnement 1 mois" : (documentTitle ?? "Document");

  async function send() {
    if (!file) {
      toast.error("Choisissez la capture de votre paiement");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("La capture doit être une image");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${request.user_id}/${request.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.rpc("submit_payment_proof", { _id: request.id, _path: path });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["my-payments"] });
      toast.success("Demande envoyée. L'administrateur va vérifier votre paiement.");
      setFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
        <p className="font-semibold">{what} — {formatFcfa(request.amount)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-4" /> En attente de confirmation
        </p>
        {request.status === "pending" ? (
          <p className="mt-2 text-muted-foreground">
            Votre capture a bien été reçue. L'accès sera ouvert dès que l'administrateur aura
            confirmé le paiement.
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Après avoir payé sur Wave, joignez ici la capture d'écran de votre paiement.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={send} disabled={busy || !file}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            {request.status === "pending" ? "Remplacer la capture" : "Envoyer la demande de validation"}
          </Button>
          <Button variant="outline" asChild>
            <a href={WAVE_PAYMENT_URL} target="_blank" rel="noopener noreferrer">
              Rouvrir Wave
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
