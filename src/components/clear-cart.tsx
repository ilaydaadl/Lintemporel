"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";

/** Vide le panier une fois la commande payée. */
export function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
