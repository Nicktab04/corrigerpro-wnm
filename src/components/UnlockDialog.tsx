import { Crown, FileLock2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFcfa, usePricing } from "@/hooks/useLicenceHub";
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
  const { data: pricing } = usePricing();
  const price = useDocumentPrice(document);
  const soon = () => toast.info("Paiement bientôt disponible");

  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Débloquer ce contenu</DialogTitle>
          <DialogDescription>{document?.title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <button
            type="button"
            onClick={soon}
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
            onClick={soon}
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
      </DialogContent>
    </Dialog>
  );
}
