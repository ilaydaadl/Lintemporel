"use client";

import { useEffect, useRef, useState } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;

function readLast(key: string) {
  try {
    const v = Number(window.localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeNow(key: string) {
  try {
    window.localStorage.setItem(key, String(Date.now()));
  } catch {
    // stockage indisponible : le minuteur reste propre à l'onglet
  }
}

/**
 * Déconnexion après une période d'inactivité. La dernière activité est
 * partagée entre les onglets (localStorage) : bouger dans un onglet garde
 * les autres connectés. Renvoie l'état d'avertissement avant la fin.
 */
export function useIdleTimeout({
  storageKey,
  timeoutMs,
  warnBeforeMs = 0,
  enabled,
  onTimeout,
}: {
  storageKey: string;
  timeoutMs: number;
  warnBeforeMs?: number;
  enabled: boolean;
  onTimeout: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timeoutRef = useRef(onTimeout);

  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;
    let fired = false;
    const expire = () => {
      if (fired) return;
      fired = true;
      try {
        window.localStorage.removeItem(storageKey);
      } catch {}
      setSecondsLeft(null);
      timeoutRef.current();
    };

    // Retour après une longue absence : on déconnecte tout de suite
    const last = readLast(storageKey);
    if (last && Date.now() - last > timeoutMs) {
      expire();
      return;
    }
    writeNow(storageKey);

    let lastWrite = Date.now();
    const onActivity = () => {
      // Écriture limitée à une fois toutes les 10 s
      if (Date.now() - lastWrite > 10_000) {
        lastWrite = Date.now();
        writeNow(storageKey);
        setSecondsLeft(null);
      }
    };
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    const check = () => {
      const lastActivity = readLast(storageKey) ?? lastWrite;
      const idle = Date.now() - lastActivity;
      if (idle >= timeoutMs) expire();
      else if (warnBeforeMs && idle >= timeoutMs - warnBeforeMs) {
        setSecondsLeft(Math.ceil((timeoutMs - idle) / 1000));
      } else setSecondsLeft(null);
    };
    const interval = window.setInterval(check, 1000);
    document.addEventListener("visibilitychange", check);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [enabled, storageKey, timeoutMs, warnBeforeMs]);

  return {
    /** Secondes avant déconnexion pendant l'avertissement, sinon null. */
    secondsLeft,
    /** « Rester connectée » : repart pour une période complète. */
    stayActive: () => {
      writeNow(storageKey);
      setSecondsLeft(null);
    },
  };
}

export const IDLE = {
  /** Espace admin : 30 minutes d'inactivité, avertissement 1 minute avant. */
  admin: { key: "lintemporel-admin-activite", timeoutMs: 30 * 60_000, warnBeforeMs: 60_000 },
  /** Clientes : 30 jours sans visite. */
  customer: { key: "lintemporel-activite", timeoutMs: 30 * 24 * 3_600_000 },
};
