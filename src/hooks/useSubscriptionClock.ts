import { useEffect, useState } from "react";

/** Re-render at the expiration instant without polling the database. */
export function useSubscriptionClock(expiresAt?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const current = Date.now();
      setNow(current);
      if (timer) clearTimeout(timer);
      const remaining = expiresAt ? Date.parse(expiresAt) - current : 0;
      if (remaining > 0) timer = setTimeout(update, Math.min(remaining + 1, 2_147_483_647));
    };
    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [expiresAt]);
  return now;
}