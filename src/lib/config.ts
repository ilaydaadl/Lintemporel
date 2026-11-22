// Réglages de la boutique — à adapter librement.
import type { ColorOptions } from "./types";

export const SITE = {
  name: "L'Intemporel",
  tagline: "Des pièces essentielles pour tous les jours",
  description:
    "L'Intemporel : des pièces essentielles, pensées pour vos looks du quotidien.",
  instagram: "lintemporelfrs",
  instagramUrl: "https://www.instagram.com/lintemporelfrs",
  email: "lintemporelf@gmail.com",
};

/** Catégories de la boutique : ajoutez, retirez ou réordonnez librement.
 *  « label » est le nom affiché (et enregistré sur l'article), « slug » l'adresse. */
export const CATEGORIES = [
  { slug: "pulls", label: "Pulls" },
  { slug: "hauts", label: "Hauts" },
  { slug: "pantalons", label: "Pantalons" },
  { slug: "robes", label: "Robes" },
  { slug: "vestes-manteaux", label: "Vestes & Manteaux" },
  { slug: "accessoires", label: "Accessoires" },
] as const;

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function categoryByLabel(label: string | null) {
  return CATEGORIES.find((c) => c.label === label) ?? null;
}

/** Couleurs proposées dans l'admin, avec leur pastille. Ajoutez-en librement ;
 *  une couleur tapée à la main hors de cette liste s'affiche en gris neutre. */
export const COLORS = [
  { name: "Noir", hex: "#1f1b19" },
  { name: "Blanc", hex: "#fbfaf7" },
  { name: "Écru", hex: "#efe7d8" },
  { name: "Beige", hex: "#d8c7af" },
  { name: "Sable", hex: "#cdb79a" },
  { name: "Camel", hex: "#b48a5e" },
  { name: "Taupe", hex: "#8f7a68" },
  { name: "Chocolat", hex: "#5a4030" },
  { name: "Gris", hex: "#9a9a9a" },
  { name: "Gris anthracite", hex: "#4a4a4d" },
  { name: "Bleu ciel", hex: "#a9c1dc" },
  { name: "Bleu marine", hex: "#27324a" },
  { name: "Vert sauge", hex: "#a3ad92" },
  { name: "Kaki", hex: "#6b6a45" },
  { name: "Rose poudré", hex: "#e3c4bf" },
  { name: "Bordeaux", hex: "#6d2632" },
] as const;

/** Teinte d'une couleur : celle choisie sur l'article, sinon celle de la palette,
 *  sinon un gris neutre. */
export function colorHex(name: string, options?: ColorOptions | null) {
  const own = options?.[name]?.hex;
  if (own && /^#[0-9a-f]{6}$/i.test(own)) return own;
  return paletteHex(name) ?? "#b9b2aa";
}

export function paletteHex(name: string) {
  const n = name.trim().toLowerCase();
  return COLORS.find((c) => c.name.toLowerCase() === n)?.hex ?? null;
}

export type ShippingMethod = "relay" | "home";

export const SHIPPING = {
  /** Livraison offerte en point relais à partir de ce montant, en centimes. */
  freeFromCents: 4000,
  methods: {
    relay: {
      label: "Point relais Mondial Relay",
      short: "Point relais",
      delay: "3 à 5 jours ouvrés",
      cents: 490,
      /** Offerte au-delà de freeFromCents ? */
      freeAboveThreshold: true,
      countries: ["FR", "BE", "LU"],
    },
    home: {
      label: "À domicile (Colissimo)",
      short: "À domicile",
      delay: "2 à 3 jours ouvrés",
      cents: 790,
      freeAboveThreshold: false,
      countries: ["FR", "BE", "LU", "CH"],
    },
  } satisfies Record<
    ShippingMethod,
    {
      label: string;
      short: string;
      delay: string;
      cents: number;
      freeAboveThreshold: boolean;
      countries: string[];
    }
  >,
  /** Code enseigne Mondial Relay pour la carte des points relais.
   *  Réglez-le dans Vercel (variable NEXT_PUBLIC_MONDIAL_RELAY_BRAND) avec le code
   *  fourni à l'ouverture de votre compte professionnel Mondial Relay.
   *  À défaut, « BDTEST » (code de démonstration public) est utilisé. */
  mondialRelayBrand:
    process.env.NEXT_PUBLIC_MONDIAL_RELAY_BRAND?.trim() || "BDTEST",
};

export function shippingCents(method: ShippingMethod, subtotalCents: number) {
  const m = SHIPPING.methods[method];
  return m.freeAboveThreshold && subtotalCents >= SHIPPING.freeFromCents
    ? 0
    : m.cents;
}

/** Lien de suivi du colis selon le mode de livraison. */
export function trackingUrl(method: string | null, tracking: string) {
  const n = encodeURIComponent(tracking.trim());
  return method === "home"
    ? `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`
    : "https://www.mondialrelay.fr/suivi-de-colis/";
}

/** Offre de bienvenue : chaque inscrite à la newsletter reçoit un code
 *  personnel (ex. BIENVENUE-7KQ2), valable une seule fois. Le site crée
 *  lui-même le bon de réduction et les codes dans Stripe. */
export const OFFER = {
  percent: 10,
  /** Début des codes personnels. */
  codePrefix: "BIENVENUE",
  /** Identifiant du bon de réduction Stripe utilisé pour ces codes. */
  stripeCouponId: "LINTEMPOREL_BIENVENUE",
};

/** Informations légales (mentions légales, CGV, confidentialité).
 *  À COMPLÉTER : tant qu'un champ est vide, la page affiche « à compléter » en rouge. */
export const LEGAL = {
  /** Nom et prénom de l'entrepreneur·e (ou nom de la société). */
  ownerName: "",
  /** Statut juridique. */
  status: "Entrepreneur individuel (micro-entreprise)",
  /** Adresse postale du siège (peut être une domiciliation). */
  address: "",
  /** Numéro SIRET (14 chiffres). */
  siret: "",
  /** Téléphone de contact (obligatoire dans les mentions légales). */
  phone: "",
  /** true si franchise en base de TVA (cas habituel en micro-entreprise). */
  vatExempt: true,
  /** Numéro de TVA intracommunautaire, si vatExempt est false. */
  vatNumber: "",
  /** Médiateur de la consommation (adhésion obligatoire pour vendre aux particuliers). */
  mediatorName: "",
  mediatorUrl: "",
  /** Date de dernière mise à jour des pages légales. */
  updatedAt: "22 novembre 2026",
};

/** Hébergeurs (mentions légales et confidentialité). */
export const HOSTS = {
  site: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    url: "https://vercel.com",
  },
  data: { name: "Supabase Inc.", place: "Union européenne (Irlande)", url: "https://supabase.com" },
};

/** Délai pour changer d'avis, en jours. */
export const RETURNS_DAYS = 14;

/** Informations taille affichées sur les fiches. */
export const FIT = {
  /** Tailles couvertes par une « Taille unique ». */
  oneSizeRange: "34 au 40",
  oneSizeShort: "34–40",
  modelHeight: "1m68",
  modelSize: "S",
};

/** « Pulls · Taille unique (34–40) » ou « Pulls · S · M · L ». */
export function sizeSummary(sizes: string[]) {
  if (sizes.length === 0) return "";
  if (sizes.length === 1 && /unique/i.test(sizes[0])) {
    return `Taille unique (${FIT.oneSizeShort})`;
  }
  return sizes.join(" · ");
}

/** Photo de la bannière d'accueil. Déposez un fichier dans /public (ex. "/hero.jpg")
 *  et indiquez son chemin ici ; laissé vide, une illustration est affichée. */
export const HERO_IMAGE = "";

/** « M » → « Taille M », mais « Taille unique » reste tel quel. */
export function sizeLabel(size: string) {
  return /^taille(\s|$)/i.test(size.trim()) ? size.trim() : `Taille ${size}`;
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
