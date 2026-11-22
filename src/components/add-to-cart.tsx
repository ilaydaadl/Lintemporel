"use client";

import Link from "next/link";
import { useState } from "react";
import { cart, useCart } from "@/lib/cart";
import {
  colorHex,
  FIT,
  formatPrice,
  RETURNS_DAYS,
  SHIPPING,
} from "@/lib/config";
import { colorAvailable, sizeAvailable, stockFor } from "@/lib/stock";
import type { ColorOptions } from "@/lib/types";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    image: string | null;
    sizes: string[];
    colors: string[];
    colorOptions?: ColorOptions;
    stock: number;
    variantStock?: Record<string, number>;
  };
  initialColor?: string | null;
  onColorChange?: (color: string) => void;
};

/** Barre « Plus que X € pour la livraison offerte ». */
export function FreeShippingProgress({
  subtotalCents,
  className = "",
}: {
  subtotalCents: number;
  className?: string;
}) {
  const goal = SHIPPING.freeFromCents;
  const remaining = goal - subtotalCents;
  const ratio = Math.min(1, Math.max(0, subtotalCents / goal));
  return (
    <div className={className}>
      <div className="h-[3px] w-full overflow-hidden bg-line">
        <div
          className="h-full bg-ink transition-[width] duration-500"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-muted">
        {remaining > 0
          ? `Plus que ${formatPrice(remaining)} pour la livraison offerte en point relais`
          : "Livraison offerte en point relais ✓"}
      </p>
    </div>
  );
}

export function AddToCart({ product, initialColor, onColorChange }: Props) {
  const options = product.colorOptions ?? {};
  const { subtotalCents } = useCart();
  const [color, setColor] = useState<string | null>(
    initialColor ?? (product.colors.length === 1 ? product.colors[0] : null),
  );
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null,
  );
  const [added, setAdded] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const soldOut = product.stock <= 0;
  // Stock par variante (même forme que l'article en base)
  const stocked = {
    stock: product.stock,
    variant_stock: product.variantStock ?? {},
    colors: product.colors,
    sizes: product.sizes,
  };
  const ready =
    (product.colors.length === 0 || !!color) && (product.sizes.length === 0 || !!size);
  const left = ready ? stockFor(stocked, color, size) : null;
  const variantSoldOut = left === 0;
  const oneSize =
    product.sizes.length === 1 && /unique/i.test(product.sizes[0] ?? "");
  const modelNote = `La mannequin mesure ${FIT.modelHeight} et porte du ${FIT.modelSize}.`;

  function add() {
    if (product.colors.length > 0 && !color) {
      setMissing("Choisissez une couleur pour continuer.");
      return;
    }
    if (product.sizes.length > 0 && !size) {
      setMissing("Choisissez une taille pour continuer.");
      return;
    }
    cart.add({
      id: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      image: (color && options[color]?.image) || product.image,
      size,
      color,
      colorHex: color ? colorHex(color, options) : null,
    });
    setAdded(true);
  }

  return (
    <div className="mt-7 space-y-6">
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm">
            Couleur : <span className="text-muted">{color ?? "à choisir"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                title={colorAvailable(stocked, c) ? c : `${c} — épuisée`}
                aria-label={colorAvailable(stocked, c) ? c : `${c} (épuisée)`}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  onColorChange?.(c);
                  setMissing(null);
                  setAdded(false);
                }}
                className={`relative rounded-full p-[3px] ring-1 transition ${
                  color === c ? "ring-ink" : "ring-transparent hover:ring-taupe"
                }`}
              >
                <span
                  className={`block h-9 w-9 rounded-full ring-1 ring-ink/15 ${
                    colorAvailable(stocked, c) ? "" : "opacity-40"
                  }`}
                  style={{ backgroundColor: colorHex(c, options) }}
                />
                {!colorAvailable(stocked, c) && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink/60"
                  />
                )}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {product.sizes.length > 0 && (
        <fieldset>
          <div className="mb-3 flex items-baseline justify-between">
            <legend className="text-sm">Taille</legend>
            <Link href="/guide-des-tailles" className="text-sm underline underline-offset-4">
              Guide des tailles
            </Link>
          </div>
          {oneSize ? (
            <div className="flex items-center gap-4 bg-sand p-3">
              <span className="shrink-0 bg-ink px-3 py-2 text-xs text-cream">
                {product.sizes[0]}
              </span>
              <p className="text-sm leading-snug">
                Convient du {FIT.oneSizeRange}. {modelNote}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!sizeAvailable(stocked, s, color)}
                    title={sizeAvailable(stocked, s, color) ? s : `${s} — épuisée`}
                    onClick={() => {
                      setSize(s);
                      setMissing(null);
                      setAdded(false);
                    }}
                    aria-pressed={size === s}
                    className={`min-w-11 border px-3 py-2 text-sm font-normal transition-colors ${
                      size === s
                        ? "border-ink bg-ink text-cream"
                        : "border-line bg-white hover:border-taupe"
                    } disabled:cursor-not-allowed disabled:border-line disabled:bg-sand disabled:text-muted disabled:line-through`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">{modelNote}</p>
            </>
          )}
        </fieldset>
      )}

      {missing && <p className="text-sm text-red-800">{missing}</p>}

      <div>
        <button
          type="button"
          className="btn btn-dark w-full py-4"
          onClick={add}
          disabled={soldOut || variantSoldOut}
        >
          {soldOut
            ? "Épuisé"
            : variantSoldOut
              ? "Épuisé dans ce choix"
              : `Ajouter au panier · ${formatPrice(product.priceCents)}`}
        </button>
        {left !== null && left > 0 && left <= 3 && (
          <p className="mt-2 text-center text-sm text-red-800">
            Plus que {left} pièce{left > 1 ? "s" : ""} dans ce choix
          </p>
        )}
        {added && (
          <p className="mt-2 text-center text-sm">
            Ajouté ✓ —{" "}
            <Link href="/panier" className="underline underline-offset-4">
              voir le panier
            </Link>
          </p>
        )}
        <FreeShippingProgress subtotalCents={subtotalCents} className="mt-3" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="border border-line bg-white/60 p-3">
          <p className="font-normal">Point relais</p>
          <p className="text-muted">
            {formatPrice(SHIPPING.methods.relay.cents)} · offert dès{" "}
            {SHIPPING.freeFromCents / 100} €
          </p>
        </div>
        <div className="border border-line bg-white/60 p-3">
          <p className="font-normal">Domicile</p>
          <p className="text-muted">{formatPrice(SHIPPING.methods.home.cents)}</p>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z" />
        </svg>
        Paiement sécurisé par carte (Stripe)
      </p>

      <details className="group border-y border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-normal">
          Livraison &amp; retours
          <span className="text-lg leading-none transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="space-y-2 pb-4 text-sm leading-relaxed text-muted">
          <p>
            <span className="text-ink">Point relais Mondial Relay</span> :{" "}
            {formatPrice(SHIPPING.methods.relay.cents)}, offert dès{" "}
            {SHIPPING.freeFromCents / 100} € d&apos;achat ({SHIPPING.methods.relay.delay}).
          </p>
          <p>
            <span className="text-ink">À domicile en France (Colissimo)</span> :{" "}
            {formatPrice(SHIPPING.methods.home.cents)} ({SHIPPING.methods.home.delay}).
          </p>
          <p>
            <span className="text-ink">Retours</span> : vous avez {RETURNS_DAYS} jours
            après réception pour changer d&apos;avis, sans justification.{" "}
            <Link href="/livraison-retours" className="underline underline-offset-4">
              En savoir plus
            </Link>
          </p>
        </div>
      </details>
    </div>
  );
}
