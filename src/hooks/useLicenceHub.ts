import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/licencehub";

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
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




export async function openDocument(storagePath: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 120);
  if (error || !data) throw error ?? new Error("Lien indisponible");
  return data.signedUrl;
}

function buildFilename(storagePath: string, title: string) {
  const extension = storagePath.split("?")[0]?.split(".").pop();
  const cleanTitle = title.replace(/[\\/:*?"<>|]/g, "-").trim() || "document";
  const hasExtension = extension && extension.length <= 5 && !cleanTitle.toLowerCase().endsWith(`.${extension.toLowerCase()}`);
  return hasExtension ? `${cleanTitle}.${extension}` : cleanTitle;
}

function triggerAnchorDownload(href: string, filename: string, sameOrigin: boolean) {
  const anchor = window.document.createElement("a");
  anchor.href = href;
  if (sameOrigin) anchor.download = filename;
  anchor.rel = "noopener";
  anchor.target = sameOrigin ? "_self" : "_blank";
  anchor.style.display = "none";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function blobDownload(storagePath: string, filename: string) {
  const { data, error } = await supabase.storage.from("documents").download(storagePath);
  if (error || !data) throw error ?? new Error("Téléchargement indisponible");
  const objectUrl = URL.createObjectURL(data);
  triggerAnchorDownload(objectUrl, filename, true);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function downloadDocument(storagePath: string, title: string) {
  const filename = buildFilename(storagePath, title);
  const errors: unknown[] = [];

  // 1) Signed URL with attachment headers — best on iOS/Android where
  //    blob-URL downloads are often blocked.
  let signedUrl: string | null = null;
  try {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(storagePath, 300, { download: filename });
    if (error) throw error;
    signedUrl = data?.signedUrl ?? null;
    if (signedUrl) {
      triggerAnchorDownload(signedUrl, filename, false);
      return;
    }
  } catch (error) {
    errors.push(error);
  }

  // 2) Fetch the private file and save the blob locally.
  try {
    await blobDownload(storagePath, filename);
    return;
  } catch (error) {
    errors.push(error);
  }

  // 3) Last resort: open the signed link so the user can save it manually.
  if (signedUrl) {
    const opened = window.open(signedUrl, "_blank", "noopener");
    if (opened) return;
    window.location.href = signedUrl;
    return;
  }

  throw errors[0] ?? new Error("Téléchargement indisponible");
}


