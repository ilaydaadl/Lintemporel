"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { ColorSwatch } from "@/components/color-swatch";
import { ProductPlaceholder } from "@/components/knit-visual";
import { cart, useCart } from "@/lib/cart";
import { RelayPicker } from "@/components/relay-picker";
import {
  formatPrice,
  SHIPPING,
  sizeLabel,
  shippingCents as computeShipping,
  type ShippingMethod,
} from "@/lib/config";
import type { Relay } from "@/lib/types";

export default function PanierPage() {
  const { items, subtotalCents } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<ShippingMethod>("relay");
  const [relay, setRelay] = useState<Relay | null>(null);

  const shippingCents = computeShipping(method, subtotalCents);
  const needsRelay = method === "relay" && !relay;

  async function checkout() {
    if (needsRelay) {
      setError("Choisissez votre point relais sur la carte.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            size: i.size,
            color: i.color ?? null,
            quantity: i.quantity,
          })),
          shipping: { method, relay: method === "relay" ? relay : null },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Le paiement n'a pas pu démarrer.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="font-display mb-8 text-center text-4xl">Votre panier</h1>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-muted">Votre panier est vide.</p>
          <Link href="/boutique" className="btn mt-6">
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li
                key={`${item.id}-${item.size}-${item.color ?? ""}`}
                className="flex gap-4 py-4"
              >
                <Link
                  href={`/produit/${item.slug}`}
                  className="h-28 w-22 shrink-0 overflow-hidden bg-sand"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductPlaceholder name={item.name} />
                  )}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <p className="font-normal">{item.name}</p>
                    <p className="shrink-0 font-normal">
                      {formatPrice(item.priceCents * item.quantity)}
                    </p>
                  </div>
                  {(item.size || item.color) && (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      {item.color && (
                        <>
                          <ColorSwatch name={item.color} hex={item.colorHex} size="h-3 w-3" />
                          {item.color}
                        </>
                      )}
                      {item.color && item.size && <span>·</span>}
                      {item.size && <>{sizeLabel(item.size)}</>}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-4 text-sm">
                    <div className="flex items-center border border-line bg-white">
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        className="px-3 py-1"
                        onClick={() =>
                          cart.setQuantity(item.id, item.size, item.quantity - 1, item.color ?? null)
                        }
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center font-normal">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        className="px-3 py-1"
                        onClick={() =>
                          cart.setQuantity(item.id, item.size, item.quantity + 1, item.color ?? null)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-muted underline underline-offset-4 hover:text-ink"
                      onClick={() => cart.setQuantity(item.id, item.size, 0, item.color ?? null)}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <section className="mt-10" aria-labelledby="livraison">
            <h2 id="livraison" className="font-display text-2xl">
              Livraison
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(SHIPPING.methods) as ShippingMethod[]).map((m) => {
                const info = SHIPPING.methods[m];
                const cost = computeShipping(m, subtotalCents);
                const active = method === m;
                return (
                  <label
                    key={m}
                    className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                      active
                        ? "border-ink bg-white"
                        : "border-line bg-white/50 hover:border-taupe"
                    }`}
                  >
                    <input
                      type="radio"
                      name="livraison"
                      value={m}
                      checked={active}
                      onChange={() => {
                        setMethod(m);
                        setError(null);
                      }}
                      className="mt-1 accent-[#3b302a]"
                    />
                    <span className="flex-1">
                      <span className="flex justify-between gap-2 font-normal">
                        {info.short}
                        <span>{cost === 0 ? "Offerte" : formatPrice(cost)}</span>
                      </span>
                      <span className="block text-sm text-muted">
                        {info.label} · {info.delay}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {method === "relay" && (
              <div className="mt-5">
                {relay ? (
                  <div className="flex flex-wrap items-start justify-between gap-3 border border-ink bg-white p-4 text-sm">
                    <div>
                      <p className="eyebrow mb-1 text-muted">Votre point relais</p>
                      <p className="font-medium">{relay.name}</p>
                      <p>{relay.address}</p>
                      <p>
                        {relay.postcode} {relay.city}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      onClick={() => setRelay(null)}
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <p className="mb-3 text-sm text-muted">
                    Tapez votre code postal puis cliquez sur le point relais de
                    votre choix.
                  </p>
                )}
                <div className={relay ? "hidden" : ""}>
                  <RelayPicker
                    onSelect={(r) => {
                      setRelay(r);
                      if (r) setError(null);
                    }}
                  />
                </div>
              </div>
            )}
            {method === "home" && (
              <p className="mt-4 text-sm text-muted">
                Vous saisirez votre adresse de livraison sur la page de paiement.
              </p>
            )}
          </section>

          <dl className="ml-auto mt-8 max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Sous-total</dt>
              <dd className="font-normal">{formatPrice(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livraison</dt>
              <dd className="font-normal">
                {shippingCents === 0 ? "Offerte" : formatPrice(shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-medium">Total</dt>
              <dd className="font-medium">
                {formatPrice(subtotalCents + shippingCents)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 text-right">
            <button
              type="button"
              className="btn w-full sm:w-auto"
              onClick={checkout}
              disabled={loading}
              aria-disabled={needsRelay}
            >
              {loading ? "Redirection…" : "Passer au paiement sécurisé"}
            </button>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Paiement par carte sur la page sécurisée de Stripe. Vos données
              bancaires ne transitent jamais par notre site.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
