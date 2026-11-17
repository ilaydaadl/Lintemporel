import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/clear-cart";

export const metadata: Metadata = { title: "Merci pour votre commande" };

export default function SuccesPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <ClearCart />
      <p className="eyebrow text-muted">Commande confirmée</p>
      <h1 className="font-display mt-3 text-5xl">Merci !</h1>
      <p className="mt-5 leading-relaxed">
        Votre paiement a bien été reçu. Un reçu vous a été envoyé par e-mail et
        nous préparons votre colis avec soin.
      </p>
      <Link href="/boutique" className="btn mt-8">
        Continuer mes achats
      </Link>
    </section>
  );
}
