"use client";

import Link from "next/link";
import { useState } from "react";
import { cart } from "@/lib/cart";
import { colorHex } from "@/lib/config";
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
  };
  initialColor?: string | null;
  onColorChange?: (color: string) => void;
};

export function AddToCart({ product, initialColor, onColorChange }: Props) {
  const options = product.colorOptions ?? {};
  const [color, setColor] = useState<string | null>(
    initialColor ?? (product.colors.length === 1 ? product.colors[0] : null),
  );
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null,
  );
  const [added, setAdded] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const soldOut = product.stock <= 0;

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
    <div className="mt-8 space-y-6">
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">
            Couleur
            {color && (
              <span className="ml-2 normal-case tracking-normal text-muted">
                {color}
              </span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={c}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  onColorChange?.(c);
                  setMissing(null);
                  setAdded(false);
                }}
                className={`rounded-full p-0.5 ring-1 transition ${
                  color === c
                    ? "ring-ink"
                    : "ring-transparent hover:ring-taupe"
                }`}
              >
                <span
                  className="block h-8 w-8 rounded-full ring-1 ring-ink/15"
                  style={{ backgroundColor: colorHex(c, options) }}
                />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {product.sizes.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Taille</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
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
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {missing && <p className="text-sm text-red-800">{missing}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn" onClick={add} disabled={soldOut}>
          {soldOut ? "Épuisé" : "Ajouter au panier"}
        </button>
        {added && (
          <Link href="/panier" className="text-sm underline underline-offset-4">
            Ajouté ✓ — voir le panier
          </Link>
        )}
      </div>
    </div>
  );
}
