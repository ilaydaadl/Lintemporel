import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { DEMO_PRODUCTS } from "./demo-products";
import { CATEGORIES } from "./config";
import type { Product } from "./types";

export type CategoryLink = { slug: string; label: string };

/** Catégories qui ont au moins un article en ligne (les autres sont masquées). */
export async function getActiveCategories(): Promise<CategoryLink[]> {
  const products = await getProducts();
  return CATEGORIES.filter((c) => products.some((p) => p.category === c.label)).map(
    (c) => ({ slug: c.slug, label: c.label }),
  );
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

/** Client public (lecture seule du catalogue, soumis aux règles RLS). */
function publicClient() {
  return createClient(url!, key!, { auth: { persistSession: false } });
}

/** Tous les articles en ligne, du plus récent au plus ancien. */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  if (!isSupabaseConfigured) return DEMO_PRODUCTS;
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`${error.message} — ${error.details ?? ""}`);
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Lecture directe (sans cache) pour le paiement : prix et stock à jour. */
export async function getProductsByIdsFresh(ids: string[]): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return DEMO_PRODUCTS.filter((p) => ids.includes(p.id));
  }
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return data as Product[];
}
