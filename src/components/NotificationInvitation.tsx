import { useIsAdmin, useSessionUser } from "@/hooks/useLicenceHub";
import { PhoneAppCard } from "@/components/PhoneAppCard";
import { pushLoginId } from "@/lib/push-invitation";

export function NotificationInvitation() {
  const { user } = useSessionUser();
  const roles = useIsAdmin(user?.id);
  if (!user || !roles.isSuccess || roles.data?.isAdmin) return null;
  // Auth session and getUser may return different precision/timezone formats.
  const loginId = pushLoginId(user.last_sign_in_at ?? user.created_at);
  return <PhoneAppCard userId={user.id} loginId={loginId} invitationOnly />;
}