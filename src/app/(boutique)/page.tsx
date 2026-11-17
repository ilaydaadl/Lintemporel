/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { HeroRail } from "@/components/knit-visual";
import { ProductGrid } from "@/components/product-card";
import { CATEGORIES, HERO_IMAGE, SHIPPING, SITE } from "@/lib/config";
import { getProducts } from "@/lib/products";

const PERKS = [
  {
    title: "Livraison soignée",
    text: `Point relais ou domicile — offerte en relais dès ${SHIPPING.freeFromCents / 100} €`,
    icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  },
  {
    title: "Paiement sécurisé",
    text: "Par carte, via Stripe",
    icon: "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5zM12 14v3",
  },
  {
    title: "Pièces choisies",
    text: "En petite quantité, avec soin",
    icon: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z",
  },
];

export default async function HomePage() {
  const products = await getProducts();
  const featured = products.filter((p) => p.is_featured);
  const favourites = (featured.length > 0 ? featured : products).slice(0, 4);
  const tiles = CATEGORIES.map((c) => ({
    ...c,
    image:
      products.find((p) => p.category === c.label && p.images[0])?.images[0] ??
      null,
  }));

  return (
    <>
      {/* Bannière */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(100deg, #d9ccbd 0%, #cbbba8 48%, #b7a591 100%)",
        }}
      >
        <div className="absolute inset-y-0 right-0 w-full opacity-35 md:w-[60%] md:opacity-100">
          {HERO_IMAGE ? (
            <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
          ) : (
            <HeroRail />
          )}
        </div>
        <div className="relative mx-auto flex min-h-[460px] max-w-7xl flex-col justify-center px-6 py-20 sm:px-8 md:min-h-[600px]">
          <p className="eyebrow rise">Nouvelle collection</p>
          <h1 className="font-display rise rise-1 mt-4 text-[4rem] leading-[0.95] sm:text-8xl">
            {SITE.name}
          </h1>
          <p className="rise rise-2 mt-6 max-w-sm text-lg font-normal leading-snug">
            Des pièces essentielles, pensées pour vos looks du quotidien.
          </p>
          <div className="rise rise-3 mt-9 flex flex-wrap gap-3">
            <Link href="/nouveautes" className="btn btn-dark">
              Découvrir les nouveautés
            </Link>
            <Link href="/boutique" className="btn btn-ghost">
              Toute la boutique
            </Link>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">Parcourir</p>
            <h2 className="font-display mt-1 text-4xl">Par catégorie</h2>
          </div>
          <Link href="/boutique" className="link-arrow shrink-0 text-sm font-normal">
            Tout voir
          </Link>
        </div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {tiles.map((t) => (
            <Link
              key={t.slug}
              href={`/boutique/${t.slug}`}
              className="group relative aspect-[3/4] w-40 shrink-0 snap-start overflow-hidden bg-sand sm:w-auto"
            >
              {t.image ? (
                <img
                  src={t.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="knit h-full w-full transition-transform duration-700 ease-out group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/5 to-transparent" />
              <span className="font-display absolute inset-x-3 bottom-3 text-2xl leading-tight text-white">
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Coups de cœur */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">La sélection</p>
            <h2 className="font-display mt-1 text-4xl">Nos coups de cœur</h2>
          </div>
          <Link href="/nouveautes" className="link-arrow shrink-0 text-sm font-normal">
            Nouveautés
          </Link>
        </div>
        <ProductGrid products={favourites} />
      </section>

      {/* Les essentiels */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid overflow-hidden bg-sand md:grid-cols-2">
          <div className="knit min-h-52 md:min-h-80" aria-hidden />
          <div className="flex flex-col justify-center px-8 py-12 sm:px-14">
            <p className="eyebrow text-muted">Toute l&apos;année</p>
            <h2 className="font-display mt-2 text-5xl">Les essentiels</h2>
            <p className="mt-4 max-w-sm font-normal leading-relaxed">
              Des basiques intemporels, à porter et reporter toute l&apos;année.
            </p>
            <div className="mt-7">
              <Link href="/boutique" className="btn">
                Voir la sélection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Engagements */}
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:grid-cols-3 sm:px-8">
        {PERKS.map((perk) => (
          <div key={perk.title} className="flex items-start gap-4">
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 h-7 w-7 shrink-0 text-taupe-dark"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
              strokeLinecap="round"
              aria-hidden
            >
              <path d={perk.icon} />
            </svg>
            <div>
              <p className="font-medium">{perk.title}</p>
              <p className="text-sm text-muted">{perk.text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
