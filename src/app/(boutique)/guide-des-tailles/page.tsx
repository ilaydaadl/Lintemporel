import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { FIT, SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Guide des tailles" };

export default function GuideDesTaillesPage() {
  return (
    <InfoPage eyebrow="Aide" title="Guide des tailles">
      <div>
        <h2>Taille unique</h2>
        <p className="mt-3">
          La plupart de nos pièces sont en taille unique, avec une coupe ample
          et confortable. Elles conviennent du{" "}
          <span className="text-ink">{FIT.oneSizeRange}</span>.
        </p>
      </div>

      <div>
        <h2>Nos photos</h2>
        <p className="mt-3">
          La mannequin mesure <span className="text-ink">{FIT.modelHeight}</span>{" "}
          et porte habituellement du{" "}
          <span className="text-ink">{FIT.modelSize}</span>. Les pièces en
          taille unique sont donc portées légèrement oversize sur les photos.
        </p>
      </div>

      <div>
        <h2>Un doute ?</h2>
        <p className="mt-3">
          Écrivez-nous à{" "}
          <a href={`mailto:${SITE.email}`} className="text-ink underline underline-offset-4">
            {SITE.email}
          </a>{" "}
          ou en message privé sur Instagram : nous vous conseillons avec
          plaisir. Et si la pièce ne vous va pas, vous pouvez la{" "}
          <Link href="/livraison-retours" className="text-ink underline underline-offset-4">
            retourner
          </Link>
          .
        </p>
      </div>
    </InfoPage>
  );
}
