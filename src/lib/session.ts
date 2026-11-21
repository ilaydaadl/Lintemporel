"use client";

import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { getBrowserSupabase } from "./supabase-browser";

// Session de connexion partagée par tous les composants (une seule écoute).
type State = { session: Session | null; ready: boolean };
let state: State = { session: null, ready: false };
const SERVER_STATE: State = { session: null, ready: false };
const listeners = new Set<() => void>();
let started = false;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const supabase = getBrowserSupabase();
  if (!supabase) {
    state = { session: null, ready: true };
    return;
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    state = { session, ready: true };
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** { session, ready } — ready passe à true une fois la session connue. */
export function useSession() {
  return useSyncExternalStore(
    subscribe,
    () => {
      start();
      return state;
    },
    () => SERVER_STATE,
  );
}
