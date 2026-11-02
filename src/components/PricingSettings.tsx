import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePricing } from "@/hooks/useLicenceHub";
import { validSubscriptionMonths } from "@/lib/subscriptions";

export function PricingSettings() {
  const queryClient = useQueryClient();
  const { data } = usePricing();
  const [unit, setUnit] = useState("");
  const [sub, setSub] = useState("");
  const [months, setMonths] = useState("1");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setUnit(String(data.unit_price));
      setSub(String(data.subscription_price));
      setMonths(String(data.subscription_duration_months));
    }
  }, [data]);

  async function save() {
    const unit_price = Number(unit);
    const subscription_price = Number(sub);
    const subscription_duration_months = Number(months);
    if (!validSubscriptionMonths(subscription_duration_months)) {
      toast.error("La durée doit être un nombre entier de mois, supérieur à zéro");
      return;
    }
    if (!Number.isInteger(unit_price) || unit_price < 0 || !Number.isInteger(subscription_price) || subscription_price < 0) {
      toast.error("Entrez des prix valides (nombres entiers)");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ unit_price, subscription_price, subscription_duration_months, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["pricing"] });
    toast.success("Tarifs enregistrés");
  }

  return (
    <div className="mt-8 rounded-3xl border border-border bg-card p-5">
      <h2 className="font-bold">Tarifs</h2>
      <p className="text-sm text-muted-foreground">
        Prix par défaut des Corrections et Résumés non gratuits (chaque document peut avoir son propre prix).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="unit-price">Prix par défaut d'un document (FCFA)</Label>
          <Input id="unit-price" type="number" min={0} value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-price">Prix de l’abonnement (FCFA)</Label>
          <Input id="sub-price" type="number" min={0} value={sub} onChange={(e) => setSub(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub-months">Durée de l’abonnement (mois)</Label>
          <Input id="sub-months" type="number" min={1} step={1} value={months} onChange={(e) => setMonths(e.target.value)} />
        </div>
        <Button onClick={save} disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Enregistrer
        </Button>
      </div>
    </div>
  );
}
