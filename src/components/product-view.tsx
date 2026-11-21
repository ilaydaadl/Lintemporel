"use client";
/* eslint-disable @next/next/no-img-element */

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { AddToCart } from "./add-to-cart";
import { ProductPlaceholder } from "./knit-visual";

/** Galerie (miniatures + grande photo) et choix couleur/taille. */
export function ProductView({
  product,
  header,
}: {
  product: Product;
  header: React.ReactNode;
}) {
  const images = product.images;
  const options = product.color_options ?? {};
  // Couleur choisie depuis la carte de la boutique (?couleur=...)
  const requested = useSearchParams().get("couleur");
  const initialColor =
    requested && (product.colors ?? []).includes(requested) ? requested : null;
  const initialImage = initialColor ? options[initialColor]?.image : undefined;
  const [current, setCurrent] = useState(
    initialImage && images.includes(initialImage)
      ? initialImage
      : (images[0] ?? null),
  );
  const lowStock = product.stock > 0 && product.stock <= 3;

  function onColorChange(color: string) {
    const image = options[color]?.image;
    if (image && images.includes(image)) setCurrent(image);
  }

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {images.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto sm:w-20 sm:shrink-0 sm:flex-col sm:overflow-visible">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-pressed={current === src}
                onClick={() => setCurrent(src)}
                className={`aspect-[3/4] w-16 shrink-0 overflow-hidden bg-sand ring-1 transition sm:w-full ${
                  current === src ? "ring-ink" : "ring-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-sand">
          {current ? (
            <img
              key={current}
              src={current}
              alt={product.name}
              className="fade-in h-full w-full object-cover"
            />
          ) : (
            <ProductPlaceholder name={product.name} />
          )}
          {lowStock && (
            <span className="absolute left-3 top-3 bg-cream/95 px-2.5 py-1 text-xs font-normal">
              Plus que {product.stock} en stock
            </span>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        {header}
        <AddToCart
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            priceCents: product.price_cents,
            image: images[0] ?? null,
            sizes: product.sizes,
            colors: product.colors ?? [],
            colorOptions: options,
            stock: product.stock,
          }}
          initialColor={initialColor}
          onColorChange={onColorChange}
        />
      </div>
    </div>
  );
}
