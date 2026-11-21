import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import {
  FIT,
  formatPrice,
  OFFER,
  RETURNS_DAYS,
  SHIPPING,
  SITE,
} from "@/lib/config";

export const metadata: Metadata = { title: "FAQ" };

const QUESTIONS = [
  {
    q: "Combien coûte la livraison ?",
    a: `Point relais Mondial Relay : ${formatPrice(SHIPPING.methods.relay.cents)}, offert dès ${
      SHIPPING.freeFromCents / 100
    } € d'achat. À domicile (Colissimo) : ${formatPrice(SHIPPING.methods.home.cents)}.`,
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Vous recevez un e-mail avec le numéro de suivi dès que votre colis est envoyé.",
  },
  {
    q: "Puis-je retourner un article ?",
    a: `Oui, vous avez ${RETURNS_DAYS} jours après réception pour changer d'avis, sans justification. Écrivez-nous à ${SITE.email}.`,
  },
  {
    q: "Quelle taille choisir ?",
    a: `Nos pièces en taille unique conviennent du ${FIT.oneSizeRange}. La mannequin mesure ${FIT.modelHeight} et porte du ${FIT.modelSize}.`,
  },
  {
    q: "Le paiement est-il sécurisé ?",
    a: "Oui. Le paiement par carte se fait sur la page sécurisée de Stripe : vos données bancaires ne passent jamais par notre site.",
  },
  {
    q: "Y a-t-il une offre pour la première commande ?",
    a: `Oui : inscrivez-vous à la newsletter (en bas de page) et recevez un code personnel de −${OFFER.percent} %, valable une fois, à saisir sur la page de paiement.`,
  },
  {
    q: "Les articles seront-ils réassortis ?",
    a: "Rarement : nos pièces sont choisies en petite quantité. Inscrivez-vous à la newsletter pour être prévenue des nouveautés.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage eyebrow="Aide" title="Questions fréquentes">
      <div className="divide-y divide-line border-y border-line">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-normal text-ink">
              {q}
              <span className="text-lg leading-none transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-4">{a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
