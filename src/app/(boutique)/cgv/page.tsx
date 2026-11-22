import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { Article, Fill } from "@/components/legal";
import { formatPrice, LEGAL, RETURNS_DAYS, SHIPPING, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Conditions générales de vente" };

const link = "text-ink underline underline-offset-4";

export default function CgvPage() {
  const { relay, home } = SHIPPING.methods;
  const contact = (
    <a href={`mailto:${SITE.email}`} className={link}>
      {SITE.email}
    </a>
  );

  return (
    <InfoPage
      eyebrow={`Mise à jour le ${LEGAL.updatedAt}`}
      title="Conditions générales de vente"
    >
      <Article n={1} title="Objet">
        <p>
          Les présentes conditions générales de vente (CGV) régissent les ventes
          conclues à distance sur le site {SITE.name} entre le vendeur et toute
          personne physique agissant en qualité de consommatrice ou consommateur
          (« la cliente »). Passer commande implique leur acceptation sans réserve.
          Les CGV applicables sont celles en vigueur à la date de la commande.
        </p>
      </Article>

      <Article n={2} title="Vendeur">
        <p>
          <Fill value={LEGAL.ownerName} label="nom et prénom" />, {LEGAL.status}, dont
          le siège est situé <Fill value={LEGAL.address} label="adresse" />, immatriculé
          sous le numéro SIRET <Fill value={LEGAL.siret} label="SIRET" />. Contact :{" "}
          {contact}.
        </p>
      </Article>

      <Article n={3} title="Produits">
        <p>
          Les articles proposés sont décrits et photographiés avec le plus grand soin.
          Les couleurs peuvent légèrement varier selon l&apos;écran utilisé. Les pièces
          étant proposées en petite quantité, les offres sont valables dans la limite
          des stocks disponibles.
        </p>
      </Article>

      <Article n={4} title="Prix">
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises.
          {LEGAL.vatExempt && " TVA non applicable, article 293 B du Code général des impôts."}{" "}
          Les frais de livraison sont indiqués avant la validation de la commande. Le
          prix facturé est celui affiché au moment de la commande.
        </p>
      </Article>

      <Article n={5} title="Commande">
        <p>
          La cliente sélectionne ses articles, choisit son mode de livraison, puis
          procède au paiement sur la page sécurisée de notre prestataire Stripe. Le
          contrat est conclu dès la confirmation du paiement. Une confirmation de
          commande est envoyée par e-mail. Le vendeur se réserve le droit
          d&apos;annuler une commande en cas de litige antérieur avec la cliente ou
          d&apos;anomalie manifeste (erreur de prix, suspicion de fraude) ; la cliente
          est alors intégralement remboursée.
        </p>
      </Article>

      <Article n={6} title="Codes promotionnels">
        <p>
          Les codes promotionnels ne sont ni cumulables, ni échangeables contre de
          l&apos;argent. Le code de bienvenue remis à l&apos;inscription à la newsletter
          est personnel, valable une seule fois et réservé à une première commande.
        </p>
      </Article>

      <Article n={7} title="Paiement">
        <p>
          Le paiement s&apos;effectue par carte bancaire (ou tout autre moyen proposé
          sur la page de paiement) via Stripe, prestataire de paiement sécurisé. Le
          montant est débité lors de la validation de la commande. Le vendeur n&apos;a
          jamais accès aux données bancaires de la cliente.
        </p>
      </Article>

      <Article n={8} title="Livraison">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Point relais Mondial Relay ({relay.countries.join(", ")}) :{" "}
            {formatPrice(relay.cents)}, offert dès {SHIPPING.freeFromCents / 100} €
            d&apos;achat. Délai indicatif : {relay.delay}.
          </li>
          <li>
            À domicile, Colissimo ({home.countries.join(", ")}) :{" "}
            {formatPrice(home.cents)}. Délai indicatif : {home.delay}.
          </li>
        </ul>
        <p>
          Sauf indication contraire, la commande est expédiée dans un délai maximal
          de 30 jours. En cas de retard, la cliente peut, après avoir demandé au
          vendeur de livrer dans un délai supplémentaire raisonnable, résoudre le
          contrat si la livraison n&apos;intervient pas dans ce délai. Le risque de
          perte ou d&apos;endommagement est transféré à la cliente lors de la remise
          du colis. En cas de colis abîmé, nous vous invitons à émettre des réserves
          auprès du transporteur et à nous contacter rapidement.
        </p>
      </Article>

      <Article n={9} title="Droit de rétractation">
        <p>
          Conformément aux articles L221-18 et suivants du Code de la consommation,
          la cliente dispose d&apos;un délai de <strong className="text-ink">{RETURNS_DAYS} jours</strong>{" "}
          à compter de la réception de sa commande pour se rétracter, sans avoir à
          motiver sa décision.
        </p>
        <p>
          Pour l&apos;exercer, elle informe le vendeur de sa décision par une
          déclaration dénuée d&apos;ambiguïté, par e-mail à {contact} ou au moyen du
          formulaire ci-dessous. Elle renvoie ensuite les articles au plus tard{" "}
          {RETURNS_DAYS} jours après avoir communiqué sa décision. Les frais de retour
          sont à la charge de la cliente. Les articles doivent être renvoyés complets,
          non portés et dans leur état d&apos;origine ; la responsabilité de la cliente
          peut être engagée en cas de dépréciation résultant de manipulations autres
          que celles nécessaires pour établir leur nature et leurs caractéristiques.
        </p>
        <p>
          Le vendeur rembourse la totalité des sommes versées, frais de livraison
          initiaux compris (sur la base du mode de livraison standard le moins cher),
          au plus tard 14 jours après avoir été informé de la décision de
          rétractation. Il peut différer le remboursement jusqu&apos;à la récupération
          des articles ou jusqu&apos;à la preuve de leur expédition. Le remboursement
          est effectué avec le même moyen de paiement que celui utilisé pour la
          commande.
        </p>
      </Article>

      <Article n={10} title="Garanties légales">
        <div className="border border-line bg-white/60 p-4 text-sm">
          <p>
            La cliente dispose d&apos;un délai de deux ans à compter de la délivrance
            du bien pour obtenir la mise en œuvre de la garantie légale de conformité
            en cas d&apos;apparition d&apos;un défaut de conformité (articles L217-3 et
            suivants du Code de la consommation). Durant ce délai, elle n&apos;est
            tenue d&apos;établir que l&apos;existence du défaut de conformité, et non la
            date de son apparition. Elle peut obtenir la réparation ou le remplacement
            du bien, ou, à défaut, une réduction du prix ou la résolution du contrat.
          </p>
          <p className="mt-3">
            Elle bénéficie également de la garantie légale des vices cachés (articles
            1641 à 1649 du Code civil), pendant deux ans à compter de la découverte du
            défaut, lui permettant d&apos;obtenir une réduction du prix ou
            l&apos;annulation de la vente.
          </p>
        </div>
      </Article>

      <Article n={11} title="Service client et réclamations">
        <p>
          Pour toute question ou réclamation, la cliente peut contacter le vendeur à{" "}
          {contact}.
        </p>
      </Article>

      <Article n={12} title="Médiation de la consommation">
        <p>
          En cas de litige non résolu après une réclamation écrite auprès du vendeur,
          la cliente peut recourir gratuitement au médiateur de la consommation
          suivant (articles L611-1 et suivants du Code de la consommation) :{" "}
          {LEGAL.mediatorName ? (
            LEGAL.mediatorUrl ? (
              <a href={LEGAL.mediatorUrl} className={link}>
                {LEGAL.mediatorName}
              </a>
            ) : (
              LEGAL.mediatorName
            )
          ) : (
            <Fill value="" label="médiateur de la consommation" />
          )}
          .
        </p>
      </Article>

      <Article n={13} title="Données personnelles">
        <p>
          Les données collectées lors de la commande sont traitées conformément à
          notre{" "}
          <Link href="/confidentialite" className={link}>
            politique de confidentialité
          </Link>
          .
        </p>
      </Article>

      <Article n={14} title="Droit applicable">
        <p>
          Les présentes CGV sont soumises au droit français. À défaut de résolution
          amiable, le litige pourra être porté devant les juridictions compétentes
          dans les conditions prévues par la loi.
        </p>
      </Article>

      <Article title="Annexe — Formulaire de rétractation">
        <p className="text-sm">
          Veuillez compléter et renvoyer ce formulaire uniquement si vous souhaitez
          vous rétracter du contrat (par e-mail à {contact}).
        </p>
        <div className="border border-dashed border-ink/40 bg-white/60 p-5 text-sm leading-relaxed">
          <p>
            À l&apos;attention de <Fill value={LEGAL.ownerName} label="nom et prénom" />,{" "}
            <Fill value={LEGAL.address} label="adresse" />, {SITE.email} :
          </p>
          <p className="mt-3">
            Je vous notifie par la présente ma rétractation du contrat portant sur la
            vente du bien ci-dessous :
          </p>
          <ul className="mt-3 space-y-2">
            <li>Commandé le : ……………… / reçu le : ………………</li>
            <li>Article(s) concerné(s) : ………………………………</li>
            <li>Nom de la cliente : ………………………………</li>
            <li>Adresse de la cliente : ………………………………</li>
            <li>Signature (uniquement en cas d&apos;envoi papier) : ………………</li>
            <li>Date : ………………</li>
          </ul>
        </div>
      </Article>
    </InfoPage>
  );
}
