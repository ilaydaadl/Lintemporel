import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { Article, Fill } from "@/components/legal";
import { HOSTS, LEGAL, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Politique de confidentialité" };

const link = "text-ink underline underline-offset-4";

const DATA = [
  {
    what: "Commande",
    data: "Nom, e-mail, téléphone, adresses de livraison et de facturation ou point relais choisi, articles commandés, montant",
    why: "Traiter et livrer la commande, assurer le service client (exécution du contrat) ; tenir la comptabilité (obligation légale)",
    keep: "10 ans pour les pièces comptables, 3 ans après la dernière commande pour le reste",
  },
  {
    what: "Compte cliente",
    data: "E-mail, mot de passe (chiffré, jamais lisible), favoris, historique de commandes",
    why: "Permettre de retrouver ses commandes et favoris (exécution du contrat)",
    keep: "Jusqu'à la suppression du compte, ou 3 ans sans connexion",
  },
  {
    what: "Newsletter",
    data: "E-mail, date d'inscription, code de bienvenue",
    why: "Envoyer les nouveautés et offres (consentement, retirable à tout moment)",
    keep: "Jusqu'à la désinscription, ou 3 ans sans ouverture",
  },
  {
    what: "Paiement",
    data: "Données de carte bancaire, saisies uniquement chez Stripe",
    why: "Encaisser la commande et lutter contre la fraude",
    keep: "Conservées par Stripe selon ses propres obligations ; jamais par nous",
  },
];

export default function ConfidentialitePage() {
  const contact = (
    <a href={`mailto:${SITE.email}`} className={link}>
      {SITE.email}
    </a>
  );

  return (
    <InfoPage
      eyebrow={`Mise à jour le ${LEGAL.updatedAt}`}
      title="Politique de confidentialité"
    >
      <Article title="Qui est responsable de vos données ?">
        <p>
          Le responsable du traitement est <Fill value={LEGAL.ownerName} label="nom et prénom" />,{" "}
          {LEGAL.status}, <Fill value={LEGAL.address} label="adresse" />. Pour toute
          question relative à vos données : {contact}.
        </p>
      </Article>

      <Article title="Quelles données et pourquoi ?">
        <div className="space-y-4">
          {DATA.map((d) => (
            <div key={d.what} className="border border-line bg-white/60 p-4 text-sm">
              <p className="font-medium text-ink">{d.what}</p>
              <p className="mt-1">
                <span className="text-ink">Données :</span> {d.data}.
              </p>
              <p className="mt-1">
                <span className="text-ink">Finalité :</span> {d.why}.
              </p>
              <p className="mt-1">
                <span className="text-ink">Conservation :</span> {d.keep}.
              </p>
            </div>
          ))}
        </div>
        <p>Nous ne vendons ni ne louons jamais vos données.</p>
      </Article>

      <Article title="Qui y a accès ?">
        <p>
          Vos données sont accessibles à {SITE.name} et à ses prestataires,
          uniquement pour ce qui est nécessaire à leur mission :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stripe — paiement sécurisé ;</li>
          <li>{HOSTS.data.name} — hébergement des données ({HOSTS.data.place}) ;</li>
          <li>{HOSTS.site.name} — hébergement du site ;</li>
          <li>Brevo — envoi des e-mails (newsletter, compte) ;</li>
          <li>Mondial Relay et La Poste (Colissimo) — livraison des colis.</li>
        </ul>
        <p>
          Certains prestataires (Stripe, Vercel) peuvent traiter des données hors de
          l&apos;Union européenne, notamment aux États-Unis. Ces transferts sont
          encadrés par des garanties appropriées (cadre de protection des données
          UE–États-Unis ou clauses contractuelles types de la Commission européenne).
        </p>
      </Article>

      <Article title="Cookies et stockage local">
        <p>
          Le site n&apos;utilise <strong className="text-ink">aucun cookie publicitaire ni de mesure d&apos;audience</strong>.
          Seuls des éléments strictement nécessaires à son fonctionnement sont
          enregistrés sur votre appareil : le contenu de votre panier, votre session
          de connexion à votre compte, et les éléments déposés par Stripe pour
          sécuriser le paiement. Ils ne nécessitent pas votre consentement.
        </p>
        <p>
          La carte de choix du point relais est fournie par Mondial Relay, qui peut
          recevoir le code postal recherché.
        </p>
      </Article>

      <Article title="Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement, de limitation, d&apos;opposition et de portabilité de vos
          données, ainsi que du droit de retirer votre consentement à tout moment
          (par exemple via le lien de désinscription présent dans chaque newsletter).
          Pour les exercer, écrivez-nous à {contact}. Nous vous répondons dans un
          délai d&apos;un mois.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser
          une réclamation à la CNIL (
          <a href="https://www.cnil.fr" className={link}>
            cnil.fr
          </a>
          ).
        </p>
      </Article>

      <Article title="Sécurité">
        <p>
          Les échanges avec le site sont chiffrés (HTTPS). L&apos;accès aux données
          est limité par des règles strictes : chaque cliente ne voit que ses propres
          commandes et favoris, et les mots de passe ne sont jamais stockés en clair.
        </p>
      </Article>
    </InfoPage>
  );
}
