"use client";
/* eslint-disable @next/next/no-img-element */

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { AddToCart } from "./add-to-cart";
import { ProductPlaceholder } from "./knit-visual";

/** Galerie + choix couleur/taille : la photo suit la couleur sélectionnée. */
export function ProductView({
  product,
  header,
  footer,
}: {
  product: Product;
  header: React.ReactNode;
  footer: React.ReactNode;
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

  function onColorChange(color: string) {
    const image = options[color]?.image;
    if (image && images.includes(image)) setCurrent(image);
  }

  return (
    <div className="mt-6 grid gap-10 md:grid-cols-2">
      <div>
        <div className="aspect-[3/4] overflow-hidden bg-sand">
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
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-pressed={current === src}
                onClick={() => setCurrent(src)}
                className={`aspect-[3/4] overflow-hidden bg-sand ring-1 transition ${
                  current === src ? "ring-ink" : "ring-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="md:sticky md:top-24 md:self-start">
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
        {footer}
      </div>
    </div>
  );
}
