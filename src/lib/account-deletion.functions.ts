import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canDeleteAccount } from "./account-deletion";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ targetId: z.string().uuid().optional() }))
  .handler(async ({ data, context }) => {
    // getUser revalidates existence, even if a deleted account still has an unexpired JWT.
    const { data: current, error: authError } = await context.supabase.auth.getUser();
    if (authError || current.user?.id !== context.userId) throw new Error("Reconnectez-vous pour continuer.");
    const targetId = data.targetId ?? context.userId;
    const { data: actorAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError) throw new Error("Impossible de vérifier les droits de suppression.");
    if (targetId !== context.userId && !actorAdmin) throw new Error("Vous pouvez uniquement supprimer votre propre compte.");
    const { data: targetAdmin, error: targetRoleError } = await context.supabase.rpc("has_role", { _user_id: targetId, _role: "admin" });
    if (targetRoleError || !canDeleteAccount(context.userId, targetId, Boolean(actorAdmin), Boolean(targetAdmin))) {
      throw new Error("La suppression d’un autre administrateur n’est pas autorisée.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: targetError } = await supabaseAdmin.auth.admin.getUserById(targetId);
    if (targetError || !target.user) throw new Error("Compte introuvable.");

    // Remove personal proofs, including abandoned uploads; never delete shared course files.
    const proofs = supabaseAdmin.storage.from("payment-proofs");
    while (true) {
      const { data: files, error } = await proofs.list(targetId, { limit: 100 });
      if (error) throw new Error("Impossible de supprimer les captures de paiement. Réessayez.");
      if (!files?.length) break;
      const { error: removeError } = await proofs.remove(files.map((file) => `${targetId}/${file.name}`));
      if (removeError) throw new Error("Impossible de supprimer les captures de paiement. Réessayez.");
    }
    // Re-save shared uploads with service ownership so Auth can delete their original owner.
    const { data: uploads, error: uploadsError } = await supabaseAdmin.from("documents").select("storage_path").eq("uploaded_by", targetId);
    if (uploadsError) throw new Error("Impossible de vérifier les documents déposés.");
    for (const document of uploads ?? []) {
      const bucket = supabaseAdmin.storage.from("documents");
      const { data: file, error: downloadError } = await bucket.download(document.storage_path);
      if (downloadError || !file) throw new Error("Impossible de préserver les documents déposés. Réessayez.");
      const { error: saveError } = await bucket.upload(document.storage_path, file, { upsert: true, contentType: file.type });
      if (saveError) throw new Error("Impossible de préserver les documents déposés. Réessayez.");
    }
    // Hard-delete Auth itself, not just the profile: this releases the email for signup.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId, false);
    if (deleteError) throw new Error("Impossible de supprimer ce compte pour le moment. Réessayez.");
    return { deleted: true, self: targetId === context.userId };
  });