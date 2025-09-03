// lib/subscriptionGuard.js
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";

/**
 * activeUntilMillis geçmişse /student/subscription?renew=1'e yönlendirir.
 * İsteğe bağlı graceDays (örn. 0 veya 2) verebilirsin.
 */
export function useSubscriptionGuard({ plan, activeUntilMillis, graceDays = 0 }) {
  const router = useRouter();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    if (!plan) return; // plan yoksa banner zaten göstereceksin
    const now = Date.now();
    const grace = graceDays * 24 * 60 * 60 * 1000;
    const expired = typeof activeUntilMillis === "number" && now > (activeUntilMillis + grace);

    if (expired) {
      doneRef.current = true;
      // loop’u önlemek için bir flag bırak
      sessionStorage.setItem("bl_expired_redirect", "1");
      router.replace("/student/subscription?renew=1");
    }
  }, [plan, activeUntilMillis, graceDays, router]);
}
