import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Panier" };

export default async function PanierPage() {
  const products = await getProducts();
  return <CartView products={products} />;
}
