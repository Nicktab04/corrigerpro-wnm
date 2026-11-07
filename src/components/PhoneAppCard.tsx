import { useEffect, useState } from "react";
import { Bell, BellRing, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enablePush, isIos, isStandalone, type PushResult } from "@/lib/push";
import { pushInvitationKey, shouldInvitePush } from "@/lib/push-invitation";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PhoneAppCard({ userId, loginId, invitationOnly = false }: { userId: string; loginId?: string; invitationOnly?: boolean }) {
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());
    setNotifOn("Notification" in window && Notification.permission === "granted");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    const onRegistered = () => setNotifOn(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("corrigepro:push-registered", onRegistered);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("corrigepro:push-registered", onRegistered);
    };
  }, []);

  useEffect(() => {
    if (!invitationOnly || !loginId) return;
    const permission = "Notification" in window ? Notification.permission : "unsupported";
    const key = pushInvitationKey(userId);
    let previous: string | null = null;
    try { previous = sessionStorage.getItem(key); } catch { /* Storage may be disabled. */ }
    if (!shouldInvitePush({ permission, lastInvitation: previous, loginId })) return;
    try { sessionStorage.setItem(key, loginId); } catch { /* Invitation remains usable. */ }
    setInvitationOpen(true);
  }, [userId, loginId, invitationOnly]);

  // Refresh the stored device token silently when permission was already given.
  useEffect(() => {
    if (notifOn && invitationOnly) enablePush(userId).catch(() => undefined);
  }, [notifOn, userId, invitationOnly]);

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
    setFeedback(null);
    try {
      const r = await enablePush(userId);
      const msg: Record<PushResult["status"], string> = {
        registered: "Notifications activées ✅",
        denied: "Notifications bloquées : autorisez-les dans les réglages du navigateur pour ce site.",
        unsupported: "Ce navigateur ne gère pas les notifications.",
        "open-in-new-tab": "Ouvrez l'application dans son propre onglet pour activer les notifications.",
        "ios-install": "Sur iPhone, ajoutez d'abord CorrigéPro à l'écran d'accueil, puis ouvrez-le depuis l'icône.",
        "not-configured": "Les notifications ne sont pas configurées. Le responsable doit mettre à jour la connexion Firebase et sélectionner « Include web push ».",
      };
      if (r.status === "registered") {
        setNotifOn(true);
        setInvitationOpen(false);
        window.dispatchEvent(new Event("corrigepro:push-registered"));
        toast.success(msg["registered"]);
      } else {
        setFeedback(msg[r.status]);
        if (!invitationOpen) toast.error(msg[r.status], { duration: 9000 });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Activation impossible";
      setFeedback(message);
      if (!invitationOpen) toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (invitationOnly) return (
    <Dialog open={invitationOpen} onOpenChange={setInvitationOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-md" onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
        <DialogHeader>
          <BellRing className="mb-2 size-8 text-primary" />
          <DialogTitle>Recevoir les notifications CorrigéPro ?</DialogTitle>
          <DialogDescription>Un paiement confirmé, un nouveau document dans votre filière : restez informé.</DialogDescription>
        </DialogHeader>
        {feedback ? <p role="status" className="text-sm text-muted-foreground">{feedback}</p> : null}
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={busy} onClick={() => setInvitationOpen(false)}>Plus tard</Button>
          <Button disabled={busy} onClick={notify}>
            <Bell className="size-4" />{busy ? "Activation…" : "Activer les notifications"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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
