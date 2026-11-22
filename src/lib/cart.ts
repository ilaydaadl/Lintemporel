"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string | null;
  size: string | null;
  color?: string | null;
  colorHex?: string | null;
  quantity: number;
};

const KEY = "lintemporel-panier";
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
/** Écouteurs de modification (pour l'enregistrement dans le compte). */
const changeListeners = new Set<(origin: "local" | "remote") => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) items = JSON.parse(raw) as CartItem[];
  } catch {
    items = EMPTY;
  }
}

function commit(next: CartItem[], origin: "local" | "remote" = "local") {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // stockage indisponible (navigation privée) : le panier reste en mémoire
  }
  listeners.forEach((l) => l());
  changeListeners.forEach((l) => l(origin));
}

/** Garde uniquement des lignes de panier valides (données venant du compte). */
export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (i): i is CartItem =>
        !!i &&
        typeof i.id === "string" &&
        typeof i.slug === "string" &&
        typeof i.name === "string" &&
        typeof i.priceCents === "number" &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0,
    )
    .slice(0, 50)
    .map((i) => ({ ...i, quantity: Math.min(i.quantity, 10) }));
}

/** Clé d'une ligne : même article, même taille, même couleur. */
export const lineKey = (i: CartItem) => `${i.id}|${i.size ?? ""}|${i.color ?? ""}`;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const same = (
  a: CartItem,
  id: string,
  size: string | null,
  color: string | null = null,
) => a.id === id && a.size === size && (a.color ?? null) === color;

export const cart = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    load();
    const color = item.color ?? null;
    const found = items.find((i) => same(i, item.id, item.size, color));
    commit(
      found
        ? items.map((i) =>
            same(i, item.id, item.size, color)
              ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
              : i,
          )
        : [...items, { ...item, quantity }],
    );
  },
  setQuantity(
    id: string,
    size: string | null,
    quantity: number,
    color: string | null = null,
  ) {
    load();
    commit(
      quantity <= 0
        ? items.filter((i) => !same(i, id, size, color))
        : items.map((i) =>
            same(i, id, size, color) ? { ...i, quantity: Math.min(quantity, 10) } : i,
          ),
    );
  },
  clear() {
    loaded = true;
    commit(EMPTY);
  },
  /** Contenu actuel du panier. */
  get(): CartItem[] {
    load();
    return items;
  },
  /** Remplace le panier par celui du compte (sans le renvoyer au compte). */
  replaceFromAccount(next: CartItem[]) {
    loaded = true;
    commit(next, "remote");
  },
  /** Prévient à chaque modification ; renvoie la fonction pour arrêter. */
  onChange(listener: (origin: "local" | "remote") => void) {
    changeListeners.add(listener);
    return () => {
      changeListeners.delete(listener);
    };
  },
};

export function useCart() {
  const list = useSyncExternalStore(
    subscribe,
    () => {
      load();
      return items;
    },
    () => EMPTY,
  );
  const count = list.reduce((n, i) => n + i.quantity, 0);
  const subtotalCents = list.reduce((n, i) => n + i.quantity * i.priceCents, 0);
  return { items: list, count, subtotalCents };
}
