export const DEFAULT_SUBSCRIPTION_MONTHS = 1;

export function validSubscriptionMonths(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function hasPaidAccess(plan: string | undefined, expiresAt?: string | null, now = Date.now()) {
  return plan === "paid" && (!expiresAt || Date.parse(expiresAt) > now);
}

export function subscriptionExpired(expiresAt?: string | null, now = Date.now()) {
  return Boolean(expiresAt && Date.parse(expiresAt) <= now);
}

export function subscriptionDate(expiresAt: string) {
  return new Date(expiresAt).toLocaleString("fr-FR", { timeZone: "Africa/Abidjan", dateStyle: "medium", timeStyle: "short" });
}

export function signedLinkLifetime(expiresAt?: string | null, maximum = 120) {
  if (!expiresAt) return maximum;
  const remaining = Math.floor((Date.parse(expiresAt) - Date.now()) / 1000);
  if (remaining < 1) throw new Error("Votre abonnement a expiré");
  return Math.min(maximum, remaining);
}