"use client";

import { useEffect } from "react";
import { cart, lineKey, sanitizeCart, type CartItem } from "@/lib/cart";
import { useSession } from "@/lib/session";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/** Fusionne deux paniers : une ligne présente des deux côtés garde la plus grande quantité. */
function merge(a: CartItem[], b: CartItem[]) {
  const map = new Map<string, CartItem>();
  for (const item of [...a, ...b]) {
    const key = lineKey(item);
    const prev = map.get(key);
    map.set(key, prev ? { ...item, quantity: Math.max(prev.quantity, item.quantity) } : item);
  }
  return [...map.values()];
}

/**
 * Panier lié au compte : à la connexion, le panier de l'appareil est fusionné
 * avec celui du compte ; ensuite chaque modification est enregistrée, et le
 * panier est rechargé quand on revient sur l'onglet (autre appareil).
 */
export function CartSync() {
  const { session } = useSession();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase || !userId) return;
    let active = true;
    let ready = false;
    let lastSynced = 0; // date (ms) du panier du compte déjà appliqué ou envoyé
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function fetchRemote() {
      const { data } = await supabase!
        .from("carts")
        .select("items, updated_at")
        .eq("user_id", userId!)
        .maybeSingle();
      return data ? { items: sanitizeCart(data.items), updatedAt: data.updated_at as string } : null;
    }

    async function push() {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase!
        .from("carts")
        .upsert({ user_id: userId, items: cart.get(), updated_at: updatedAt });
      if (!error) lastSynced = Date.parse(updatedAt);
    }

    // 1. Connexion : fusion du panier local et du panier du compte
    (async () => {
      const remote = await fetchRemote();
      if (!active) return;
      const merged = merge(remote?.items ?? [], cart.get());
      cart.replaceFromAccount(merged);
      ready = true;
      await push();
    })();

    // 2. Chaque modification locale est enregistrée (regroupées sur 0,6 s)
    const stop = cart.onChange((origin) => {
      if (!ready || origin === "remote") return;
      clearTimeout(timer);
      timer = setTimeout(push, 600);
    });

    // 3. Retour sur l'onglet : on reprend le panier du compte s'il a changé ailleurs
    async function refresh() {
      if (!ready || document.visibilityState !== "visible") return;
      const remote = await fetchRemote();
      const remoteTime = remote ? Date.parse(remote.updatedAt) : 0;
      if (active && remote && remoteTime > lastSynced) {
        lastSynced = remoteTime;
        cart.replaceFromAccount(remote.items);
      }
    }
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      clearTimeout(timer);
      stop();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  return null;
}
