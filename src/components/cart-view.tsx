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
  OFFER,
  SHIPPING,
  sizeLabel,
  shippingCents as computeShipping,
  type ShippingMethod,
} from "@/lib/config";
import { FreeShippingProgress } from "@/components/add-to-cart";
import type { Product, Relay } from "@/lib/types";

/** Article à proposer pour atteindre la livraison offerte. */
function pickSuggestion(products: Product[], inCart: Set<string>, remaining: number) {
  const candidates = products.filter(
    (p) => !inCart.has(p.id) && p.stock > 0 && p.images.length > 0,
  );
  if (candidates.length === 0) return null;
  // Le moins cher qui suffit à atteindre le seuil, sinon le plus cher disponible
  const enough = candidates
    .filter((p) => p.price_cents >= remaining)
    .sort((a, b) => a.price_cents - b.price_cents);
  return enough[0] ?? [...candidates].sort((a, b) => b.price_cents - a.price_cents)[0];
}

export function CartView({ products }: { products: Product[] }) {
  const { items, subtotalCents, count } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<ShippingMethod>("relay");
  const [relay, setRelay] = useState<Relay | null>(null);

  const shippingCents = computeShipping(method, subtotalCents);
  const remaining = SHIPPING.freeFromCents - subtotalCents;
  const suggestion =
    remaining > 0
      ? pickSuggestion(products, new Set(items.map((i) => i.id)), remaining)
      : null;
  // Ajout direct seulement si l'article n'a pas de choix à faire
  const suggestionSimple =
    !!suggestion && suggestion.colors.length <= 1 && suggestion.sizes.length <= 1;
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
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-12">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl sm:text-5xl">
          Votre panier{" "}
          {count > 0 && <span className="text-2xl text-muted">({count})</span>}
        </h1>
        <Link href="/boutique" className="shrink-0 text-sm underline-offset-4 hover:underline">
          Continuer mes achats
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-muted">Votre panier est vide.</p>
          <Link href="/boutique" className="btn mt-6">
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 bg-sand p-4">
            <p className="text-sm">
              {remaining > 0 ? (
                <>
                  Plus que <strong className="font-medium">{formatPrice(remaining)}</strong> pour
                  la livraison offerte en point relais
                </>
              ) : (
                <>La livraison en point relais vous est offerte ✓</>
              )}
            </p>
            <FreeShippingProgress subtotalCents={subtotalCents} className="mt-3 [&>p]:hidden" />
          </div>

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

          {suggestion && (
            <section className="mt-8" aria-labelledby="suggestion">
              <p id="suggestion" className="eyebrow mb-3 text-muted">
                Pour atteindre la livraison offerte
              </p>
              <div className="flex items-center gap-4 border border-line bg-white/60 p-3">
                <Link
                  href={`/produit/${suggestion.slug}`}
                  className="h-20 w-16 shrink-0 overflow-hidden bg-sand"
                >
                  <img
                    src={suggestion.images[0]}
                    alt={suggestion.name}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-normal">{suggestion.name}</p>
                  <p className="text-sm text-muted">
                    {formatPrice(suggestion.price_cents)}
                    {suggestion.colors.length === 1 && <> · {suggestion.colors[0]}</>}
                  </p>
                </div>
                {suggestionSimple ? (
                  <button
                    type="button"
                    className="btn btn-outline shrink-0 px-4 py-2"
                    onClick={() =>
                      cart.add({
                        id: suggestion.id,
                        slug: suggestion.slug,
                        name: suggestion.name,
                        priceCents: suggestion.price_cents,
                        image: suggestion.images[0] ?? null,
                        size: suggestion.sizes[0] ?? null,
                        color: suggestion.colors[0] ?? null,
                      })
                    }
                  >
                    Ajouter
                  </button>
                ) : (
                  <Link
                    href={`/produit/${suggestion.slug}`}
                    className="btn btn-outline shrink-0 px-4 py-2"
                  >
                    Choisir
                  </Link>
                )}
              </div>
            </section>
          )}

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

          <p className="ml-auto mt-4 max-w-xs text-right text-xs text-muted">
            Code de bienvenue ou code promo : à saisir sur la page de paiement.
            Pas encore de code ?{" "}
            <a href="#newsletter" className="underline underline-offset-4 hover:text-ink">
              −{OFFER.percent} % en vous inscrivant
            </a>
            .
          </p>

          <div className="mt-6 text-right">
            <button
              type="button"
              className="btn btn-dark w-full py-4 sm:w-auto sm:min-w-72"
              onClick={checkout}
              disabled={loading}
              aria-disabled={needsRelay}
            >
              {loading
                ? "Redirection…"
                : `Commander · ${formatPrice(subtotalCents + shippingCents)}`}
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
