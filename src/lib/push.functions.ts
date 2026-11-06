import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

async function sendToUsers(userIds: string[], title: string, body: string, path: string) {
  if (userIds.length === 0) return 0;
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const fcmKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey || !fcmKey) throw new Error("Notifications non configurées");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: tokens } = await supabaseAdmin.from("push_tokens").select("token").in("user_id", userIds);
  let sent = 0;
  for (const { token } of tokens ?? []) {
    const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": fcmKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { path },
          webpush: { fcm_options: { link: path } },
        },
      }),
    });
    if (res.ok) sent++;
    else {
      const text = await res.text();
      console.error(`FCM send failed [${res.status}]: ${text}`);
      if (res.status === 404 || res.status === 400) await supabaseAdmin.from("push_tokens").delete().eq("token", token);
    }
  }
  return sent;
}

export const notifyPaymentReviewed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ paymentId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: p } = await context.supabase
      .from("payment_requests")
      .select("user_id, status, kind")
      .eq("id", data.paymentId)
      .single();
    if (!p || p.status !== "approved") return { sent: 0 };
    const what = p.kind === "subscription" ? "Votre abonnement est actif." : "Votre document est débloqué.";
    return { sent: await sendToUsers([p.user_id], "Paiement confirmé ✅", what, "/dashboard") };
  });

export const notifyNewDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ documentId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("documents")
      .select("title, major, uploaded_by, kind")
      .eq("id", data.documentId)
      .single();
    if (!doc || doc.uploaded_by !== context.userId) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("major", doc.major)
      .neq("id", context.userId);
    const ids = (students ?? []).map((s) => s.id);
    return {
      sent: await sendToUsers(ids, `Nouveau document en ${doc.major} 📚`, doc.title, "/dashboard"),
    };
  });
