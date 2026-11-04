import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/lib/account-deletion.functions";
import { supabase } from "@/integrations/supabase/client";

export function DeleteAccountDialog({ targetId, name }: { targetId?: string; name?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const removeAccount = useServerFn(deleteAccount);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await removeAccount({ data: { targetId } });
      if (result.self) {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut({ scope: "local" });
        await navigate({ to: "/auth", replace: true });
      } else {
        await Promise.all(["admin-profiles", "admin-uploaders", "admin-payments", "documents"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      }
      setOpen(false);
      toast.success("Compte supprimé. Le Gmail peut être utilisé pour une nouvelle inscription.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={targetId ? "sm" : "default"}>
          <Trash2 className="mr-1.5 size-4" />{targetId ? "Supprimer le compte" : "Supprimer mon compte"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{targetId ? `Supprimer le compte de ${name ?? "cet étudiant"} ?` : "Supprimer votre compte ?"}</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive. Le profil, les demandes de paiement, les captures et les accès achetés seront supprimés. Les documents publiés restent disponibles. Le même Gmail pourra être utilisé pour créer un nouveau compte gratuit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}Supprimer définitivement
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}