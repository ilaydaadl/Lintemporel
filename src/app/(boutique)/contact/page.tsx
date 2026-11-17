import type { Metadata } from "next";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14 text-center sm:px-8">
      <h1 className="font-display text-5xl">Contact</h1>
      <p className="mt-6 leading-relaxed">
        Une question sur une taille, une commande ou un retour ? Écrivez-nous,
        nous répondons rapidement.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <a href={`mailto:${SITE.email}`} className="btn">
          {SITE.email}
        </a>
        <a
          href={SITE.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline underline-offset-4"
        >
          ou en message privé sur Instagram @{SITE.instagram}
        </a>
      </div>
    </section>
  );
}
