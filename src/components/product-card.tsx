"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { colorHex, formatPrice, sizeSummary } from "@/lib/config";
import type { Product } from "@/lib/types";
import { ProductPlaceholder } from "./knit-visual";

const MAX_SWATCHES = 6;
const LOW_STOCK = 3;

/** Badge en haut à gauche de la photo : épuisé, stock faible ou nouveauté. */
export function stockBadge(product: Product) {
  if (product.stock <= 0) return "Épuisé";
  if (product.stock <= LOW_STOCK) return `Plus que ${product.stock}`;
  if (product.is_new) return "Nouveau";
  return null;
}

export function ProductCard({ product }: { product: Product }) {
  const [color, setColor] = useState<string | null>(null);
  const colors = product.colors ?? [];
  const options = product.color_options ?? {};
  const badge = stockBadge(product);

  const colorImage = color ? options[color]?.image : undefined;
  const main =
    colorImage && product.images.includes(colorImage)
      ? colorImage
      : product.images[0];
  const second = !color ? product.images[1] : undefined;
  const href = `/produit/${product.slug}${
    color ? `?couleur=${encodeURIComponent(color)}` : ""
  }`;
  const meta = [product.category, sizeSummary(product.sizes)]
    .filter(Boolean)
    .join(" · ");

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
          {badge && (
            <span className="absolute left-3 top-3 bg-cream/95 px-2.5 py-1 text-xs font-normal backdrop-blur">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <h3 className="font-normal leading-snug">{product.name}</h3>
          <p className="shrink-0 font-normal">{formatPrice(product.price_cents)}</p>
        </div>
        {meta && <p className="mt-0.5 text-sm text-muted">{meta}</p>}
      </Link>

      {colors.length > 0 && (
        <div
          role="group"
          aria-label={`Couleurs de ${product.name}`}
          className="mt-2 flex flex-wrap items-center gap-0.5"
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
                className="block h-3.5 w-3.5 rounded-full ring-1 ring-ink/15"
                style={{ backgroundColor: colorHex(c, options) }}
              />
            </button>
          ))}
          <span className="ml-1.5 text-xs text-muted">
            {color ?? `${colors.length} coloris`}
          </span>
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
