import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

import { supabase } from "@/integrations/supabase/client";

const appId = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID"] as string | undefined;
const vapidKey = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY"] as string | undefined;
const firebaseConfig = {
  apiKey: (import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY"] as string) ?? "",
  projectId: (import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID"] as string) ?? "",
  appId: appId ?? "",
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export type PushResult =
  | { status: "registered" }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" | "ios-install" };

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Call from a click handler.
export async function enablePush(userId: string): Promise<PushResult> {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !appId || !vapidKey || !firebaseConfig.messagingSenderId)
    return { status: "not-configured" };
  if (window.top !== window.self) return { status: "open-in-new-tab" };
  if (isIos() && !isStandalone()) return { status: "ios-install" };
  if (!("Notification" in window) || !(await isSupported())) return { status: "unsupported" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const query = new URLSearchParams(firebaseConfig).toString();
  const serviceWorkerRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration });
  if (!token) return { status: "denied" };
  const { error } = await supabase.from("push_tokens").upsert({ token, user_id: userId });
  if (error) throw new Error("Impossible d’enregistrer les notifications. Réessayez.");
  return { status: "registered" };
}
