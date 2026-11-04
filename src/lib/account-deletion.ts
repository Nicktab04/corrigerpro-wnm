/** A student may delete only themselves; admins may delete students, not other admins. */
export function canDeleteAccount(actorId: string, targetId: string, actorIsAdmin: boolean, targetIsAdmin: boolean) {
  return actorId === targetId || (actorIsAdmin && !targetIsAdmin);
}