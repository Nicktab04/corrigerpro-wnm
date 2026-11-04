import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/licencehub";
import { signedLinkLifetime } from "@/lib/subscriptions";
import { documentFilename } from "@/lib/document-download";

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data?.status === "pending") {
        const { data: activated, error: activationError } = await supabase
          .from("profiles")
          .update({ status: "approved" })
          .eq("id", userId)
          .eq("status", "pending")
          .select("*")
          .single();
        if (activationError) throw activationError;
        return activated as Profile;
      }
      return (data as Profile | null) ?? null;
    },
  });
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["roles", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as string);
      return { isAdmin: roles.includes("admin"), canUpload: roles.includes("uploader") };
    },
  });
}

export function usePricing() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("unit_price, subscription_price, subscription_duration_months")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data ?? { unit_price: 0, subscription_price: 0, subscription_duration_months: 1 };
    },
  });
}

export const formatFcfa = (amount: number) =>
  `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;




export async function openDocument(storagePath: string, expiresAt?: string | null) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, signedLinkLifetime(expiresAt));
  if (error || !data) throw error ?? new Error("Lien indisponible");
  return data.signedUrl;
}

export async function prepareDocumentDownload(storagePath: string, title: string) {
  const { data, error } = await supabase.storage.from("documents").download(storagePath);
  if (error || !data) throw error ?? new Error("Téléchargement indisponible");
  if (!data.size) throw new Error("Le fichier est vide");
  return new File([data], documentFilename(storagePath, title), { type: data.type || "application/octet-stream" });
}


