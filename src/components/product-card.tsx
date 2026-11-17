"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { colorHex, formatPrice } from "@/lib/config";
import type { Product } from "@/lib/types";
import { ProductPlaceholder } from "./knit-visual";

const MAX_SWATCHES = 6;

export function ProductCard({ product }: { product: Product }) {
  const [color, setColor] = useState<string | null>(null);
  const soldOut = product.stock <= 0;
  const colors = product.colors ?? [];
  const options = product.color_options ?? {};

  // Photo affichée : celle de la couleur choisie, sinon la première.
  const colorImage = color ? options[color]?.image : undefined;
  const main =
    colorImage && product.images.includes(colorImage)
      ? colorImage
      : product.images[0];
  // Au survol, deuxième photo — sauf si le client a choisi une couleur.
  const second = !color ? product.images[1] : undefined;
  const href = `/produit/${product.slug}${
    color ? `?couleur=${encodeURIComponent(color)}` : ""
  }`;

  return (
    <div className="group">
      <Link href={href} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
            {main ? (
              <img
                key={main}
                src={main}
                alt={product.name}
                loading="lazy"
                className="fade-in h-full w-full object-cover"
              />
            ) : (
              <ProductPlaceholder name={product.name} />
            )}
          </div>
          {second && (
            <img
              src={second}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          {(soldOut || product.is_new) && (
            <span
              className={`eyebrow absolute left-3 top-3 px-2.5 py-1 text-[0.62rem] backdrop-blur ${
                soldOut ? "bg-cream/90" : "bg-ink/85 text-cream"
              }`}
            >
              {soldOut ? "Épuisé" : "Nouveau"}
            </span>
          )}
          <span className="eyebrow absolute inset-x-3 bottom-3 translate-y-2 bg-cream/95 py-2.5 text-center text-[0.65rem] opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
            Voir l&apos;article
          </span>
        </div>
        <div className="mt-3.5">
          {product.category && (
            <p className="eyebrow text-[0.62rem] text-muted">
              {product.category}
            </p>
          )}
          <h3 className="mt-1 text-[0.95rem] font-normal leading-snug">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {formatPrice(product.price_cents)}
          </p>
        </div>
      </Link>

      {colors.length > 0 && (
        <div
          role="group"
          aria-label={`Couleurs de ${product.name}`}
          className="mt-2 flex flex-wrap items-center gap-1"
        >
          {colors.slice(0, MAX_SWATCHES).map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              aria-label={c}
              aria-pressed={color === c}
              onClick={() => setColor(color === c ? null : c)}
              className={`rounded-full p-[3px] ring-1 transition ${
                color === c ? "ring-ink" : "ring-transparent hover:ring-taupe"
              }`}
            >
              <span
                className="block h-4 w-4 rounded-full ring-1 ring-ink/15"
                style={{ backgroundColor: colorHex(c, options) }}
              />
            </button>
          ))}
          {colors.length > MAX_SWATCHES && (
            <Link href={href} className="ml-1 text-xs text-muted hover:text-ink">
              +{colors.length - MAX_SWATCHES}
            </Link>
          )}
          {color && (
            <span className="ml-1 text-xs text-muted">{color}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="py-20 text-center text-muted">
        Aucun article ici pour le moment — revenez très vite.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
