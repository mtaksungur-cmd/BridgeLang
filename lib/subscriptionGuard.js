import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

export function useSubscriptionGuard({ plan, activeUntilMillis, graceDays = 0 }) {
  const router = useRouter();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    if (!plan) return;
    const now = Date.now();
    const grace = graceDays * 24 * 60 * 60 * 1000;
    const expired = typeof activeUntilMillis === "number" && now > (activeUntilMillis + grace);

    if (expired) {
      doneRef.current = true;
      sessionStorage.setItem("bl_expired_redirect", "1");
      router.replace("/student/subscription?renew=1");
    }
  }, [plan, activeUntilMillis, graceDays, router]);
}
