import Link from "next/link";
import { OFFER, SITE } from "@/lib/config";
import { InstagramIcon } from "./header";
import { NewsletterForm } from "./newsletter-form";

const linkClass = "text-cream/70 transition-colors hover:text-cream";

export function Footer() {
  return (
    <footer className="mt-auto">
      {/* Newsletter */}
      <section id="newsletter" className="scroll-mt-24 bg-sand">
        <div className="mx-auto grid max-w-7xl items-end gap-8 px-6 py-14 sm:px-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">Soyez la première informée</h2>
            <p className="mt-2 text-muted">
              Les nouvelles pièces partent vite. Recevez les arrivages avant tout
              le monde, et −{OFFER.percent} % sur votre première commande.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <div className="bg-ink text-cream">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl">{SITE.name}</p>
            <p className="mt-3 max-w-xs text-sm text-cream/70">
              Des pièces essentielles pour tous les jours.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium">Boutique</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/nouveautes" className={linkClass}>
                  Nouveautés
                </Link>
              </li>
              <li>
                <Link href="/boutique/pulls" className={linkClass}>
                  Pulls &amp; gilets
                </Link>
              </li>
              <li>
                <Link href="/boutique/robes" className={linkClass}>
                  Robes
                </Link>
              </li>
              <li>
                <Link href="/boutique" className={linkClass}>
                  Toute la boutique
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium">Aide</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/livraison-retours" className={linkClass}>
                  Livraison &amp; retours
                </Link>
              </li>
              <li>
                <Link href="/guide-des-tailles" className={linkClass}>
                  Guide des tailles
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-medium">Suivez-nous</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={SITE.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${linkClass} inline-flex items-center gap-2`}
                >
                  <InstagramIcon className="h-4 w-4" />
                  Instagram @{SITE.instagram}
                </a>
              </li>
              <li className="text-cream/70">Paiement sécurisé par Stripe</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-6 py-5 text-xs text-cream/60 sm:px-8">
            <span>© {SITE.name}</span>
            <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/mentions-legales" className="hover:text-cream">
                Mentions légales
              </Link>
              <Link href="/cgv" className="hover:text-cream">
                CGV
              </Link>
              <Link href="/confidentialite" className="hover:text-cream">
                Confidentialité
              </Link>
              <Link href="/a-propos" className="hover:text-cream">
                À propos
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
