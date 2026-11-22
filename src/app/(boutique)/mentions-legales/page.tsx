import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { Article, Fill } from "@/components/legal";
import { HOSTS, LEGAL, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <InfoPage eyebrow={`Mise à jour le ${LEGAL.updatedAt}`} title="Mentions légales">
      <Article title="Éditeur du site">
        <p>
          Le site {SITE.name} est édité par <Fill value={LEGAL.ownerName} label="nom et prénom" />,{" "}
          {LEGAL.status}.
        </p>
        <ul className="space-y-1">
          <li>
            Adresse : <Fill value={LEGAL.address} label="adresse" />
          </li>
          <li>
            SIREN : <Fill value={LEGAL.siren} label="SIREN" /> (immatriculation au
            Registre national des entreprises)
          </li>
          <li>
            {LEGAL.vatExempt ? (
              "TVA non applicable, article 293 B du Code général des impôts."
            ) : (
              <>
                TVA intracommunautaire : <Fill value={LEGAL.vatNumber} label="numéro de TVA" />
              </>
            )}
          </li>
          <li>
            E-mail :{" "}
            <a href={`mailto:${SITE.email}`} className="text-ink underline underline-offset-4">
              {SITE.email}
            </a>
          </li>
          <li>
            Téléphone : <Fill value={LEGAL.phone} label="téléphone" />
          </li>
          <li>
            Directrice ou directeur de la publication :{" "}
            <Fill value={LEGAL.ownerName} label="nom et prénom" />
          </li>
        </ul>
      </Article>

      <Article title="Hébergement">
        <p>
          Le site est hébergé par {HOSTS.site.name}, {HOSTS.site.address} (
          <a href={HOSTS.site.url} className="text-ink underline underline-offset-4">
            vercel.com
          </a>
          ).
        </p>
        <p>
          Les données (catalogue, commandes, comptes clientes) sont hébergées par{" "}
          {HOSTS.data.name}, sur des serveurs situés en {HOSTS.data.place}.
        </p>
      </Article>

      <Article title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus du site (textes, photographies, logo, mise en
          page) est la propriété de {SITE.name}, sauf mention contraire. Toute
          reproduction, même partielle, sans autorisation écrite préalable est
          interdite.
        </p>
      </Article>

      <Article title="Données personnelles et cookies">
        <p>
          Le traitement de vos données personnelles est décrit dans notre{" "}
          <Link href="/confidentialite" className="text-ink underline underline-offset-4">
            politique de confidentialité
          </Link>
          .
        </p>
      </Article>
    </InfoPage>
  );
}
