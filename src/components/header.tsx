"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useCart } from "@/lib/cart";
import { CATEGORIES, SHIPPING, SITE } from "@/lib/config";

export function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
    </svg>
  );
}

const isActive = (pathname: string | null, href: string) =>
  pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));

function navClass(active: boolean) {
  return `relative py-1 transition-colors hover:text-taupe-dark after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-ink after:transition-transform ${
    active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
  }`;
}

function DesktopNav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="hidden items-center gap-7 text-sm font-normal md:flex">
      <Link href="/nouveautes" className={navClass(isActive(pathname, "/nouveautes"))}>
        Nouveautés
      </Link>
      <div className="group relative">
        <Link
          href="/boutique"
          className={`${navClass(isActive(pathname, "/boutique"))} inline-flex items-center gap-1`}
        >
          Boutique
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
          </svg>
        </Link>
        <div className="invisible absolute left-0 top-full z-50 -ml-4 pt-4 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
          <div className="min-w-56 border border-line bg-cream p-2 shadow-[0_18px_40px_-18px_rgba(59,48,42,0.35)]">
            <Link href="/boutique" className="block px-4 py-2 hover:bg-sand">
              Tout voir
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/boutique/${c.slug}`}
                className="block px-4 py-2 hover:bg-sand"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Link href="/a-propos" className={navClass(isActive(pathname, "/a-propos"))}>
        À propos
      </Link>
      <Link href="/contact" className={navClass(isActive(pathname, "/contact"))}>
        Contact
      </Link>
    </nav>
  );
}

function ActiveDesktopNav() {
  return <DesktopNav pathname={usePathname()} />;
}

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <p className="eyebrow bg-ink px-4 py-2 text-center text-[0.65rem] text-cream">
        Livraison offerte en point relais dès {SHIPPING.freeFromCents / 100} €
        <span className="mx-2 opacity-50">·</span>
        Paiement sécurisé
      </p>

      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              className="-ml-2 p-2 md:hidden"
              onClick={() => setOpen(true)}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </button>
            {/* Le lien actif dépend de l'adresse : il s'affiche dès qu'elle est connue */}
            <Suspense fallback={<DesktopNav pathname={null} />}>
              <ActiveDesktopNav />
            </Suspense>
          </div>

          <Link href="/" className="font-display text-[1.7rem] leading-none sm:text-3xl">
            {SITE.name}
          </Link>

          <div className="flex items-center justify-end gap-4">
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hidden transition-colors hover:text-taupe-dark sm:block"
            >
              <InstagramIcon />
            </a>
            <Link
              href="/panier"
              aria-label={`Panier (${count} article${count > 1 ? "s" : ""})`}
              className="relative transition-colors hover:text-taupe-dark"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6" aria-hidden>
                <path d="M5 8h14l-1 12H6L5 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-taupe-dark px-1 text-[10px] font-medium text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={close}
          />
          <nav className="drawer absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col overflow-y-auto bg-cream px-6 py-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-2xl">{SITE.name}</span>
              <button type="button" aria-label="Fermer le menu" className="-mr-2 p-2" onClick={close}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <Link href="/nouveautes" onClick={close} className="border-b border-line py-3.5 text-lg font-normal">
              Nouveautés
            </Link>
            <Link href="/boutique" onClick={close} className="border-b border-line py-3.5 text-lg font-normal">
              Toute la boutique
            </Link>
            <p className="eyebrow mt-6 mb-1 text-muted">Catégories</p>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/boutique/${c.slug}`} onClick={close} className="py-2.5 font-normal">
                {c.label}
              </Link>
            ))}
            <div className="mt-6 flex flex-col border-t border-line pt-4">
              <Link href="/a-propos" onClick={close} className="py-2.5">
                À propos
              </Link>
              <Link href="/contact" onClick={close} className="py-2.5">
                Contact
              </Link>
              <a href={SITE.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2.5">
                <InstagramIcon className="h-4.5 w-4.5" /> @{SITE.instagram}
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
