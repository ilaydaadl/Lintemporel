"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { FreeShippingProgress } from "@/components/add-to-cart";
import { ColorSwatch } from "@/components/color-swatch";
import { ProductPlaceholder } from "@/components/knit-visual";
import { RelayPicker } from "@/components/relay-picker";
import { cart, useCart } from "@/lib/cart";
import {
  formatPrice,
  OFFER,
  SHIPPING,
  shippingCents as computeShipping,
  sizeLabel,
  type ShippingMethod,
} from "@/lib/config";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Product, Relay } from "@/lib/types";

type AppliedPromo = {
  code: string;
  percentOff: number | null;
  amountOffCents: number | null;
  label: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Article à proposer pour atteindre la livraison offerte. */
function pickSuggestion(products: Product[], inCart: Set<string>, remaining: number) {
  const candidates = products.filter(
    (p) => !inCart.has(p.id) && p.stock > 0 && p.images.length > 0,
  );
  if (candidates.length === 0) return null;
  const enough = candidates
    .filter((p) => p.price_cents >= remaining)
    .sort((a, b) => a.price_cents - b.price_cents);
  return enough[0] ?? [...candidates].sort((a, b) => b.price_cents - a.price_cents)[0];
}

function promoDiscount(promo: AppliedPromo | null, subtotal: number) {
  if (!promo) return 0;
  if (promo.percentOff) return Math.round((subtotal * promo.percentOff) / 100);
  return Math.min(promo.amountOffCents ?? 0, subtotal);
}

export function CartView({ products }: { products: Product[] }) {
  const { items, subtotalCents, count } = useCart();
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [method, setMethod] = useState<ShippingMethod>("relay");
  const [relay, setRelay] = useState<Relay | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingCents = computeShipping(method, subtotalCents);
  const discount = promoDiscount(promo, subtotalCents);
  const total = subtotalCents - discount + shippingCents;
  const remaining = SHIPPING.freeFromCents - subtotalCents;
  const suggestion =
    remaining > 0
      ? pickSuggestion(products, new Set(items.map((i) => i.id)), remaining)
      : null;
  const suggestionSimple =
    !!suggestion && suggestion.colors.length <= 1 && suggestion.sizes.length <= 1;

  async function applyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeInput,
          email: email.trim(),
          subtotalCents,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Ce code n'est pas valide.");
      setPromo(data);
      setCodeInput("");
    } catch (err) {
      setPromo(null);
      setPromoError(err instanceof Error ? err.message : "Ce code n'est pas valide.");
    } finally {
      setPromoBusy(false);
    }
  }

  async function checkout() {
    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Indiquez votre adresse e-mail dans la rubrique Contact.");
      document.getElementById("cart-email")?.focus();
      return;
    }
    if (method === "relay" && !relay) {
      setError("Choisissez votre point relais sur la carte.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (optIn) {
        // Inscription newsletter (une erreur ici ne bloque pas la commande)
        await getBrowserSupabase()
          ?.from("newsletter_subscribers")
          .insert({ email: cleanEmail.toLowerCase() });
      }
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
          email: cleanEmail,
          promoCode: promo?.code ?? null,
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

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
        <h1 className="font-display text-5xl">Votre panier</h1>
        <p className="mt-4 text-muted">Votre panier est vide.</p>
        <Link href="/boutique" className="btn btn-dark mt-8">
          Découvrir la boutique
        </Link>
      </section>
    );
  }

  return (
    <div className="grid lg:min-h-[75vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      {/* ------------------------------------------------ Colonne de gauche */}
      <div className="order-2 px-4 py-10 sm:px-8 lg:order-1 lg:py-14">
        <div className="mx-auto max-w-xl lg:ml-auto lg:mr-14">
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <h1 className="font-display text-4xl sm:text-5xl">
              Commande <span className="text-2xl text-muted">({count})</span>
            </h1>
            <Link href="/boutique" className="shrink-0 text-sm underline-offset-4 hover:underline">
              Continuer mes achats
            </Link>
          </div>

          {/* Contact */}
          <section aria-labelledby="contact">
            <h2 id="contact" className="font-display text-2xl">
              Contact
            </h2>
            <label htmlFor="cart-email" className="sr-only">
              Adresse e-mail
            </label>
            <input
              id="cart-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                // Le code de bienvenue dépend de l'e-mail : on le revalide
                if (promo) {
                  setPromo(null);
                  setPromoError("Adresse modifiée : validez de nouveau votre code.");
                }
              }}
              placeholder="Adresse e-mail"
              className="field mt-3 py-3"
            />
            <label className="mt-3 flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                className="h-4 w-4 accent-[#3b302a]"
              />
              Envoyez-moi les nouveautés et les offres par e-mail
            </label>
          </section>

          {/* Livraison */}
          <section className="mt-10" aria-labelledby="livraison">
            <h2 id="livraison" className="font-display text-2xl">
              Livraison
            </h2>
            <div className="mt-3 divide-y divide-line border border-line bg-white/60">
              {(Object.keys(SHIPPING.methods) as ShippingMethod[]).map((m) => {
                const info = SHIPPING.methods[m];
                const cost = computeShipping(m, subtotalCents);
                const active = method === m;
                return (
                  <label
                    key={m}
                    className={`flex cursor-pointer items-start gap-3 p-4 transition-colors ${
                      active ? "bg-white" : "hover:bg-white/80"
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
                        {info.label}
                        <span>{cost === 0 ? "Offerte" : formatPrice(cost)}</span>
                      </span>
                      <span className="block text-sm text-muted">{info.delay}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {method === "relay" && (
              <div className="mt-4">
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
                    Tapez votre code postal puis cliquez sur le point relais de votre choix.
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
              <p className="mt-3 text-sm text-muted">
                Vous saisirez votre adresse de livraison à l&apos;étape suivante.
              </p>
            )}
          </section>

          <div className="mt-10">
            <button
              type="button"
              className="btn btn-dark w-full py-4"
              onClick={checkout}
              disabled={loading}
            >
              {loading
                ? "Redirection…"
                : `Continuer vers le paiement · ${formatPrice(total)}`}
            </button>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z" />
              </svg>
              Paiement par carte sur la page sécurisée de Stripe
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Récapitulatif */}
      <aside className="order-1 border-b border-line bg-sand px-4 py-8 sm:px-8 lg:order-2 lg:border-b-0 lg:border-l lg:py-14">
        <div className="mx-auto max-w-md lg:sticky lg:top-24 lg:ml-12 lg:mr-auto">
          <ul className="space-y-5">
            {items.map((item) => (
              <li key={`${item.id}-${item.size}-${item.color ?? ""}`} className="flex gap-4">
                <Link
                  href={`/produit/${item.slug}`}
                  className="relative h-20 w-16 shrink-0 border border-line bg-cream"
                >
                  <span className="block h-full w-full overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <ProductPlaceholder name={item.name} />
                    )}
                  </span>
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] text-cream">
                    {item.quantity}
                  </span>
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <p className="truncate font-normal">{item.name}</p>
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
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    <div className="flex items-center border border-line bg-cream">
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        className="px-2 py-0.5"
                        onClick={() =>
                          cart.setQuantity(item.id, item.size, item.quantity - 1, item.color ?? null)
                        }
                      >
                        −
                      </button>
                      <span className="min-w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        className="px-2 py-0.5"
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
            <div className="mt-6 flex items-center gap-3 border border-line bg-cream/70 p-3">
              <Link href={`/produit/${suggestion.slug}`} className="h-14 w-11 shrink-0 overflow-hidden bg-cream">
                <img src={suggestion.images[0]} alt={suggestion.name} className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-xs text-muted">Pour la livraison offerte</p>
                <p className="truncate font-normal">
                  {suggestion.name} · {formatPrice(suggestion.price_cents)}
                </p>
              </div>
              {suggestionSimple ? (
                <button
                  type="button"
                  className="shrink-0 border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-cream"
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
                  className="shrink-0 border border-ink px-3 py-1.5 text-xs hover:bg-ink hover:text-cream"
                >
                  Choisir
                </Link>
              )}
            </div>
          )}

          {/* Code de réduction */}
          <div className="mt-6 border-t border-line pt-6">
            {promo ? (
              <div className="flex items-center justify-between gap-3 bg-cream px-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium tracking-wider">{promo.code}</span>
                  <span className="text-muted"> · {promo.label}</span>
                </span>
                <button
                  type="button"
                  className="text-muted underline underline-offset-4 hover:text-ink"
                  onClick={() => setPromo(null)}
                >
                  Retirer
                </button>
              </div>
            ) : (
              <form onSubmit={applyCode} className="flex gap-2">
                <label htmlFor="promo-code" className="sr-only">
                  Code de réduction
                </label>
                <input
                  id="promo-code"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value);
                    setPromoError(null);
                  }}
                  placeholder="Code de réduction"
                  autoComplete="off"
                  className="field min-w-0 flex-1 py-3 uppercase placeholder:normal-case"
                />
                <button
                  className="btn btn-outline shrink-0 px-5"
                  disabled={promoBusy || !codeInput.trim()}
                >
                  {promoBusy ? "…" : "Valider"}
                </button>
              </form>
            )}
            {promoError && (
              <p role="alert" className="mt-2 text-sm text-red-800">
                {promoError}
              </p>
            )}
            {!promo && !promoError && (
              <p className="mt-2 text-xs text-muted">
                Première commande ? −{OFFER.percent} % avec le code{" "}
                <span className="font-medium text-ink">{OFFER.code}</span>.
              </p>
            )}
          </div>

          {/* Totaux */}
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Sous-total</dt>
              <dd>{formatPrice(subtotalCents)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt>Réduction ({promo?.code})</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Expédition · {SHIPPING.methods[method].short}</dt>
              <dd>{shippingCents === 0 ? "Offerte" : formatPrice(shippingCents)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <dt className="text-base font-medium">Total</dt>
              <dd className="text-2xl font-medium">{formatPrice(total)}</dd>
            </div>
          </dl>
          <FreeShippingProgress subtotalCents={subtotalCents} className="mt-5" />
        </div>
      </aside>
    </div>
  );
}
