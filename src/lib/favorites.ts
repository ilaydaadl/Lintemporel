"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSession } from "./session";
import { getBrowserSupabase } from "./supabase-browser";

// Favoris de la cliente connectée, partagés entre toutes les cartes.
let ids = new Set<string>();
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
const EMPTY = new Set<string>();

function emit(next: Set<string>) {
  ids = next;
  listeners.forEach((l) => l());
}

async function load(userId: string) {
  if (loadedFor === userId) return;
  loadedFor = userId;
  const supabase = getBrowserSupabase();
  if (!supabase) return;
  const { data } = await supabase.from("favorites").select("product_id");
  emit(new Set((data ?? []).map((r) => r.product_id as string)));
}

export function useFavorites() {
  const { session, ready } = useSession();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (userId) load(userId);
    else if (ready && loadedFor) {
      loadedFor = null;
      emit(new Set());
    }
  }, [userId, ready]);

  const current = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => ids,
    () => EMPTY,
  );

  async function toggle(productId: string) {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId) return false;
    const has = ids.has(productId);
    const next = new Set(ids);
    if (has) next.delete(productId);
    else next.add(productId);
    emit(next); // affichage immédiat
    const { error } = has
      ? await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId)
      : await supabase.from("favorites").insert({ user_id: userId, product_id: productId });
    if (error) {
      // Échec : on remet l'état d'avant
      const back = new Set(ids);
      if (has) back.add(productId);
      else back.delete(productId);
      emit(back);
    }
    return true;
  }

  return { ids: current, loggedIn: !!userId, ready, toggle };
}
