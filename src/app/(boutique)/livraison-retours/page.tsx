import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { formatPrice, RETURNS_DAYS, SHIPPING, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Livraison & retours" };

export default function LivraisonRetoursPage() {
  const { relay, home } = SHIPPING.methods;
  return (
    <InfoPage eyebrow="Aide" title="Livraison & retours">
      <div>
        <h2>Livraison</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <span className="text-ink">Point relais Mondial Relay</span> —{" "}
            {formatPrice(relay.cents)}, offert dès {SHIPPING.freeFromCents / 100} €
            d&apos;achat. Délai indicatif : {relay.delay}. Vous choisissez votre
            point relais directement dans le panier.
          </li>
          <li>
            <span className="text-ink">À domicile (Colissimo)</span> —{" "}
            {formatPrice(home.cents)}. Délai indicatif : {home.delay}.
          </li>
        </ul>
        <p className="mt-3">
          Dès l&apos;envoi de votre colis, vous recevez un e-mail avec son
          numéro de suivi.
        </p>
      </div>

      <div>
        <h2>Retours</h2>
        <p className="mt-3">
          Vous avez <span className="text-ink">{RETURNS_DAYS} jours</span> après
          réception pour changer d&apos;avis, sans avoir à vous justifier. Les
          articles doivent être renvoyés non portés, dans leur état d&apos;origine.
          Les frais de retour sont à votre charge. Le détail de votre droit de
          rétractation figure dans nos{" "}
          <Link href="/cgv" className="text-ink underline underline-offset-4">
            CGV
          </Link>
          , avec un formulaire de rétractation.
        </p>
        <p className="mt-3">
          Pour retourner un article, écrivez-nous à{" "}
          <a href={`mailto:${SITE.email}`} className="text-ink underline underline-offset-4">
            {SITE.email}
          </a>{" "}
          avec votre numéro de commande : nous vous indiquons la marche à suivre.
          Le remboursement est effectué sur votre moyen de paiement dès
          réception du colis.
        </p>
      </div>

      <p>
        Une autre question ?{" "}
        <Link href="/faq" className="text-ink underline underline-offset-4">
          Consultez la FAQ
        </Link>{" "}
        ou{" "}
        <Link href="/contact" className="text-ink underline underline-offset-4">
          contactez-nous
        </Link>
        .
      </p>
    </InfoPage>
  );
}
