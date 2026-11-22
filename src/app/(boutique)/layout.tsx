import { CartSync } from "@/components/cart-sync";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SessionGuard } from "@/components/session-guard";
import { getActiveCategories } from "@/lib/products";

export default async function BoutiqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getActiveCategories();
  return (
    <>
      <CartSync />
      <SessionGuard />
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
    </>
  );
}
