import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const WAVE_PAYMENT_URL = "https://pay.wave.com/m/M_ci_vd5eYWll6jXx/c/ci/";

export type PaymentKind = "document" | "subscription";
export type PaymentStatus = "awaiting_proof" | "pending" | "approved" | "rejected";

export interface PaymentRequest {
  id: string;
  user_id: string;
  kind: PaymentKind;
  document_id: string | null;
  amount: number;
  status: PaymentStatus;
  screenshot_path: string | null;
  student_seen: boolean;
  created_at: string;
  updated_at: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  awaiting_proof: "Capture à envoyer",
  pending: "En attente de confirmation",
  approved: "Confirmé",
  rejected: "Refusé",
};

export function useMyPayments(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-payments", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRequest[];
    },
  });
}

export function useMyUnlocks(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-unlocks", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_unlocks")
        .select("document_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((d) => d.document_id));
    },
  });
}

/** Demande en cours (non confirmée, non refusée) pour un document ou l'abonnement. */
export function openRequestFor(
  payments: PaymentRequest[] | undefined,
  target: { kind: PaymentKind; documentId?: string | null },
) {
  return (payments ?? []).find(
    (p) =>
      (p.status === "awaiting_proof" || p.status === "pending") &&
      p.kind === target.kind &&
      (target.kind === "subscription" || p.document_id === target.documentId),
  );
}
