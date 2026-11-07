import { useEffect, useState } from "react";
import { Bell, BellRing, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { enablePush, isIos, isStandalone } from "@/lib/push";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PhoneAppCard({ userId }: { userId: string }) {
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());
    setNotifOn("Notification" in window && Notification.permission === "granted");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // Refresh the stored device token silently when permission was already given.
  useEffect(() => {
    if (notifOn) enablePush(userId).catch(() => undefined);
  }, [notifOn, userId]);

  async function install() {
    if (installEvt) {
      await installEvt.prompt();
      const { outcome } = await installEvt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setInstallEvt(null);
      return;
    }
    if (ios) {
      toast.info("Sur iPhone : touchez le bouton Partager (carré avec flèche) puis « Sur l'écran d'accueil ».", { duration: 9000 });
    } else {
      toast.info("Ouvrez le menu ⋮ du navigateur puis « Ajouter à l'écran d'accueil ».", { duration: 9000 });
    }
  }

  async function notify() {
    setBusy(true);
    try {
      const r = await enablePush(userId);
      const msg: Record<string, string> = {
        registered: "Notifications activées ✅",
        denied: "Notifications bloquées : autorisez-les dans les réglages du navigateur pour ce site.",
        unsupported: "Ce navigateur ne gère pas les notifications.",
        "open-in-new-tab": "Ouvrez l'application dans son propre onglet pour activer les notifications.",
        "ios-install": "Sur iPhone, ajoutez d'abord CorrigéPro à l'écran d'accueil, puis ouvrez-le depuis l'icône.",
        "not-configured": "Notifications pas encore disponibles.",
      };
      if (r.status === "registered") {
        setNotifOn(true);
        toast.success(msg["registered"]);
      } else toast.error(msg[r.status], { duration: 9000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Activation impossible");
    } finally {
      setBusy(false);
    }
  }

  if (installed && notifOn) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-48">
        <p className="font-semibold">CorrigéPro sur votre téléphone</p>
        <p className="text-sm text-muted-foreground">Ajoutez l'appli et recevez une alerte pour chaque paiement confirmé et nouveau document.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!installed ? (
          <Button size="sm" variant="outline" onClick={install}>
            <Smartphone className="mr-1.5 size-4" /> Ajouter à l'écran d'accueil
          </Button>
        ) : null}
        {!notifOn ? (
          <Button size="sm" onClick={notify} disabled={busy}>
            {busy ? <BellRing className="mr-1.5 size-4 animate-pulse" /> : <Bell className="mr-1.5 size-4" />}
            Activer les notifications
          </Button>
        ) : null}
      </div>
    </div>
  );
}
