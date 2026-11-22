// Stock par variante (couleur × taille), utilisable côté navigateur et serveur.

type Stocked = {
  stock: number;
  variant_stock?: Record<string, number> | null;
  colors?: string[] | null;
  sizes?: string[] | null;
};

/** Clé d'une variante : « Couleur|Taille » (vide si l'article n'a pas ce choix). */
export function variantKey(color: string | null | undefined, size: string | null | undefined) {
  return `${color ?? ""}|${size ?? ""}`;
}

/** L'article a-t-il un stock détaillé par variante ? */
export function hasVariantStock(p: Stocked) {
  return !!p.variant_stock && Object.keys(p.variant_stock).length > 0;
}

/** Stock disponible pour une couleur et une taille données. */
export function stockFor(p: Stocked, color: string | null | undefined, size: string | null | undefined) {
  if (!hasVariantStock(p)) return p.stock;
  const v = p.variant_stock![variantKey(color ?? null, size ?? null)];
  return typeof v === "number" ? Math.max(0, v) : 0;
}

/** Toutes les combinaisons possibles de l'article (au moins une). */
export function allVariants(colors: string[], sizes: string[]) {
  const cs = colors.length ? colors : [null];
  const ss = sizes.length ? sizes : [null];
  return cs.flatMap((c) => ss.map((s) => ({ color: c, size: s, key: variantKey(c, s) })));
}

/** Une couleur est-elle disponible dans au moins une taille ? */
export function colorAvailable(p: Stocked, color: string) {
  if (!hasVariantStock(p)) return p.stock > 0;
  const sizes = p.sizes?.length ? p.sizes : [null];
  return sizes.some((s) => stockFor(p, color, s) > 0);
}

/** Une taille est-elle disponible (dans la couleur choisie, ou dans au moins une) ? */
export function sizeAvailable(p: Stocked, size: string, color: string | null) {
  if (!hasVariantStock(p)) return p.stock > 0;
  if (color) return stockFor(p, color, size) > 0;
  const colors = p.colors?.length ? p.colors : [null];
  return colors.some((c) => stockFor(p, c, size) > 0);
}
