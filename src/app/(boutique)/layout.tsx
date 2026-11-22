import { CartSync } from "@/components/cart-sync";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function BoutiqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CartSync />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
