import Link from "next/link";
import { CATEGORIES, SITE } from "@/lib/config";
import { InstagramIcon } from "./header";

export function Footer() {
  return (
    <footer className="mt-auto bg-sand">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-3xl">{SITE.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Des pièces essentielles, pensées pour vos looks du quotidien.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-4">Boutique</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/nouveautes" className="hover:text-taupe-dark">
                Nouveautés
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/boutique/${c.slug}`} className="hover:text-taupe-dark">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">La maison</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/a-propos" className="hover:text-taupe-dark">
                À propos
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-taupe-dark">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">Suivez-nous</p>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 border border-ink/20 px-4 py-3 text-sm font-normal transition-colors hover:bg-cream"
          >
            <InstagramIcon />@{SITE.instagram}
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-6 py-5 text-xs text-muted sm:px-8">
          <span>
            © {SITE.name}
          </span>
          <span>Paiement sécurisé par Stripe</span>
        </div>
      </div>
    </footer>
  );
}
