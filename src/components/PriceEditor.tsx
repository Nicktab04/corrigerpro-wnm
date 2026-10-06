import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, usePricing } from "@/hooks/useLicenceHub";
import type { DocumentRow } from "@/lib/licencehub";

/** Prix propre à un document ; vide = prix par défaut des Tarifs. */
export function PriceEditor({ document, label = "Prix" }: { document: DocumentRow; label?: string }) {
  const queryClient = useQueryClient();
  const { data: pricing } = usePricing();
  const [value, setValue] = useState(document.price != null ? String(document.price) : "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(document.price != null ? String(document.price) : "");
  }, [document.price]);

  async function save() {
    const trimmed = value.trim();
    const price = trimmed === "" ? null : Number(trimmed);
    if (price !== null && (!Number.isInteger(price) || price < 0)) {
      toast.error("Entrez un prix valide (nombre entier)");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("documents").update({ price }).eq("id", document.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    await queryClient.invalidateQueries({ queryKey: ["linked-documents"] });
    toast.success("Prix enregistré");
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <span className="shrink-0">{label} (FCFA)</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={pricing ? `Défaut : ${formatFcfa(pricing.unit_price)}` : "Défaut"}
        className="h-8 w-40 text-xs"
      />
      <Button size="sm" variant="outline" className="h-8" onClick={save} disabled={busy}>
        OK
      </Button>
    </div>
  );
}
