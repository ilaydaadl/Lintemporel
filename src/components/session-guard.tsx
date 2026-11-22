"use client";

import { IDLE, useIdleTimeout } from "@/lib/idle";
import { useSession } from "@/lib/session";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/** Clientes : déconnexion automatique après 30 jours sans visite. */
export function SessionGuard() {
  const { session } = useSession();
  useIdleTimeout({
    storageKey: IDLE.customer.key,
    timeoutMs: IDLE.customer.timeoutMs,
    enabled: !!session,
    onTimeout: () => {
      getBrowserSupabase()?.auth.signOut();
    },
  });
  return null;
}
