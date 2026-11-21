/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { HeroRail } from "@/components/knit-visual";
import { ProductCarousel } from "@/components/product-carousel";
import {
  CATEGORIES,
  formatPrice,
  HERO_IMAGE,
  OFFER,
  RETURNS_DAYS,
  SHIPPING,
} from "@/lib/config";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/types";

function HangerIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 11.5c0-1.6 1.2-2.5 2.4-2.5a2.4 2.4 0 0 1 0 4.8c-1 0-2.4.7-2.4 2.2" />
      <path d="M16 16 4.5 23.2c-.9.6-.5 1.8.5 1.8h22c1 0 1.4-1.2.5-1.8L16 16Z" />
    </svg>
  );
}

function PhotoTile({
  product,
  className,
  label = true,
}: {
  product: Product | undefined;
  className?: string;
  label?: boolean;
}) {
  const src = product?.images[0];
  return (
    <div className={`relative overflow-hidden bg-sand ${className ?? ""}`}>
      {src ? (
        <Link href={`/produit/${product!.slug}`} className="group block h-full">
          <img
            src={src}
            alt={product!.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {label && (
            <span className="absolute bottom-3 left-3 bg-cream/95 px-2.5 py-1 text-xs font-normal">
              {product!.name}
            </span>
          )}
        </Link>
      ) : (
        <div className="knit h-full w-full" aria-hidden />
      )}
    </div>
  );
}

const PERKS = [
  {
    title: "Livraison soignée",
    text: `Point relais ${formatPrice(SHIPPING.methods.relay.cents)} — offert dès ${
      SHIPPING.freeFromCents / 100
    } €. Domicile ${formatPrice(SHIPPING.methods.home.cents)}.`,
  },
  {
    title: "Retours simples",
    text: `${RETURNS_DAYS} jours pour changer d'avis, sans justification.`,
  },
  {
    title: "Paiement sécurisé",
    text: "Carte bancaire via Stripe. Vos données ne sont jamais stockées.",
  },
  {
    title: "Petites quantités",
    text: "Des pièces choisies une à une, rarement réassorties.",
  },
];

export default async function HomePage() {
  const products = await getProducts();
  const withPhoto = products.filter((p) => p.images.length > 0);
  const featured = products.filter((p) => p.is_featured);
  const favourites = featured.length > 0 ? featured : products;
  const heroMain = withPhoto.find((p) => p.is_featured) ?? withPhoto[0];
  const heroSide = withPhoto.find((p) => p !== heroMain);
  const essentials = withPhoto.find((p) => p !== heroMain && p !== heroSide) ?? heroSide;
  const minPrice = products.length
    ? Math.min(...products.map((p) => p.price_cents))
    : null;
  const tiles = CATEGORIES.map((c) => ({
    ...c,
    image:
      products.find((p) => p.category === c.label && p.images[0])?.images[0] ??
      null,
  }));

  return (
    <>
      {/* Héros */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14 lg:pt-14">
        <div>
          <p className="eyebrow rise text-muted">Nouvelle collection · Hiver</p>
          <h1 className="font-display rise rise-1 mt-4 text-5xl leading-[1.02] sm:text-6xl xl:text-7xl">
            <span className="not-italic" style={{ fontStyle: "normal" }}>
              Les mailles douces
            </span>
            <br />
            de la saison
          </h1>
          <p className="rise rise-2 mt-6 max-w-md leading-relaxed text-muted">
            Des pièces essentielles, pensées pour vos looks du quotidien —
            choisies en petite quantité
            {minPrice !== null && <>, à partir de {formatPrice(minPrice)}</>}.
          </p>
          <div className="rise rise-3 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/nouveautes" className="btn btn-dark">
              Découvrir les nouveautés <span className="ml-2">→</span>
            </Link>
            <Link href="/boutique" className="text-sm font-normal underline-offset-4 hover:underline">
              Toute la boutique
            </Link>
          </div>
          <ul className="rise rise-3 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            <li className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />
              </svg>
              Retours sous {RETURNS_DAYS} jours
            </li>
            <li className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z" />
              </svg>
              Paiement sécurisé Stripe
            </li>
          </ul>
        </div>

        <div className="grid h-[440px] grid-cols-[1.45fr_1fr] grid-rows-2 gap-3 sm:h-[520px] lg:h-[560px]">
          {HERO_IMAGE ? (
            <div className="row-span-2 overflow-hidden bg-sand">
              <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
            </div>
          ) : heroMain ? (
            <PhotoTile product={heroMain} className="row-span-2" />
          ) : (
            <div className="row-span-2 overflow-hidden bg-sand">
              <HeroRail />
            </div>
          )}
          <PhotoTile product={heroSide} />
          <div className="flex flex-col items-start justify-center bg-sand p-5 sm:p-6">
            <p className="font-display text-3xl leading-tight sm:text-4xl">
              −{OFFER.percent} %
            </p>
            <p className="font-display text-xl leading-tight">
              sur votre première commande
            </p>
            <a href="#newsletter" className="mt-3 text-xs text-muted underline underline-offset-4 hover:text-ink">
              Inscrivez-vous à la newsletter pour recevoir votre code
            </a>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">Parcourir</p>
            <h2 className="font-display mt-1 text-4xl">Par catégorie</h2>
          </div>
          <Link href="/boutique" className="shrink-0 text-sm font-normal hover:underline">
            Voir toutes les pièces
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((t) => (
            <Link key={t.slug} href={`/boutique/${t.slug}`} className="group block">
              <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-sand text-taupe-dark">
                {t.image ? (
                  <img
                    src={t.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <HangerIcon className="h-9 w-9 transition-transform duration-500 group-hover:-translate-y-1" />
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="font-display text-xl leading-tight">{t.label}</span>
                <span className="shrink-0 text-xs text-muted transition-colors group-hover:text-ink">
                  Voir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Coups de cœur */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <ProductCarousel eyebrow="La sélection" title="Nos coups de cœur" products={favourites} />
      </section>

      {/* Les essentiels */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid overflow-hidden bg-sand md:grid-cols-2">
          <PhotoTile product={essentials} label={false} className="min-h-64 md:min-h-[420px]" />
          <div className="flex flex-col justify-center px-8 py-12 sm:px-14">
            <p className="eyebrow text-muted">Toute l&apos;année</p>
            <h2 className="font-display mt-2 text-5xl">Les essentiels</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Des basiques intemporels, à porter et reporter. Chaque pièce est
              choisie en petite quantité : quand c&apos;est parti, c&apos;est parti.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>— Mailles douces, coupes faciles</li>
              <li>— Couleurs qui se marient entre elles</li>
              <li>— Retours sous {RETURNS_DAYS} jours, sans justification</li>
            </ul>
            <div className="mt-7">
              <Link href="/boutique" className="btn btn-dark">
                Voir les essentiels
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Engagements */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8">
        <div className="grid gap-8 border-y border-line py-8 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((perk) => (
            <div key={perk.title}>
              <p className="font-display text-2xl">{perk.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{perk.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
