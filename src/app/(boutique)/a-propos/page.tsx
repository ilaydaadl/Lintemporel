import type { Metadata } from "next";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "À propos" };

export default function AProposPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14 sm:px-8">
      <p className="eyebrow text-center text-muted">Notre histoire</p>
      <h1 className="font-display mt-3 text-center text-5xl">{SITE.name}</h1>
      <div className="mt-8 space-y-5 leading-relaxed">
        <p>
          {SITE.name} est née d&apos;une envie simple : proposer des pièces
          que l&apos;on garde. Des mailles douces, des coupes faciles et des
          teintes naturelles qui s&apos;accordent entre elles, saison après
          saison.
        </p>
        <p>
          Chaque article est choisi avec soin, en petite quantité, pour
          composer un vestiaire du quotidien dont on ne se lasse pas.
        </p>
      </div>
    </section>
  );
}
