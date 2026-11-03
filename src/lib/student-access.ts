import type { AccessStatus } from "./licencehub";

/** Completed profiles enter the app; only an explicit revocation blocks access. */
export function studentDestination(status: AccessStatus | undefined, isAdmin = false) {
  if (isAdmin) return "/admin" as const;
  if (!status) return "/register" as const;
  if (status === "rejected") return "/pending" as const;
  return "/dashboard" as const;
}