"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFavorites } from "@/lib/favorites";

/** Cœur « ajouter aux favoris ». Sans compte, renvoie vers la connexion. */
export function FavoriteButton({
  productId,
  productName,
  className = "",
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { ids, loggedIn, ready, toggle } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const active = ids.has(productId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Retirer ${productName} des favoris`
          : `Ajouter ${productName} aux favoris`
      }
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!ready) return;
        if (!loggedIn) {
          router.push(`/compte?suivant=${encodeURIComponent(pathname)}`);
          return;
        }
        toggle(productId);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 backdrop-blur transition hover:scale-105 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      </svg>
    </button>
  );
}
