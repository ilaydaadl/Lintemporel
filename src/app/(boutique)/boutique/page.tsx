import type { Metadata } from "next";
import { ShopView } from "@/components/shop-view";

export const metadata: Metadata = { title: "Boutique" };

export default function BoutiquePage() {
  return <ShopView />;
}
