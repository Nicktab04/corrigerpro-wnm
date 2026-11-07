type InvitationState = {
  permission: string;
  lastInvitation: string | null;
  loginId: string;
};

// Login identity is stable across token refreshes, reloads and profile completion.
export function shouldInvitePush({ permission, lastInvitation, loginId }: InvitationState) {
  return permission !== "granted" && lastInvitation !== loginId;
}

export function pushInvitationKey(userId: string) {
  return `corrigepro:push-invitation:${userId}`;
}

export function pushLoginId(timestamp: string) {
  return String(Date.parse(timestamp));
}