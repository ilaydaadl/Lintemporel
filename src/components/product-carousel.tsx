"use client";

import { useRef } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

/** Rangée d'articles qui défile, avec flèches ← → (titre fourni par le parent). */
export function ProductCarousel({
  title,
  eyebrow,
  products,
}: {
  title: string;
  eyebrow?: string;
  products: Product[];
}) {
  const track = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
          <h2 className="font-display mt-1 text-4xl">{title}</h2>
        </div>
        {products.length > 2 && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Articles précédents"
              onClick={() => scroll(-1)}
              className="flex h-10 w-10 items-center justify-center border border-line bg-white/60 transition-colors hover:border-ink"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Articles suivants"
              onClick={() => scroll(1)}
              className="flex h-10 w-10 items-center justify-center bg-ink text-cream transition-colors hover:bg-[#2a211c]"
            >
              →
            </button>
          </div>
        )}
      </div>
      <div
        ref={track}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-8 sm:gap-6 sm:px-8"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[23.4%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
