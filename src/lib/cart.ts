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

function commit(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // stockage indisponible (navigation privée) : le panier reste en mémoire
  }
  listeners.forEach((l) => l());
}

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
