import type { Product } from "./types";

// Articles d'exemple affichés tant que Supabase n'est pas connecté.
const base = {
  images: [] as string[],
  sizes: ["S", "M", "L"],
  colors: [] as string[],
  color_options: {},
  category: "Pulls",
  stock: 10,
  is_active: true,
  is_new: true,
  created_at: "2026-01-01T00:00:00Z",
};

export const DEMO_PRODUCTS: Product[] = [
  {
    ...base,
    id: "demo-1",
    name: "Pull col montant Ciel",
    slug: "pull-col-montant-ciel",
    colors: ["Bleu ciel"],
    description:
      "Un pull en maille épaisse, coupe ample et col montant. Doux, chaud, facile à porter avec tout.",
    price_cents: 3990,
    is_featured: true,
  },
  {
    ...base,
    id: "demo-2",
    name: "Pull maille Chocolat",
    slug: "pull-maille-chocolat",
    colors: ["Chocolat", "Beige"],
    description:
      "Maille côtelée couleur chocolat, tombé loose. La pièce cocooning de la saison.",
    price_cents: 4290,
    is_featured: true,
  },
  {
    ...base,
    id: "demo-3",
    name: "Pull col montant Ardoise",
    slug: "pull-col-montant-ardoise",
    colors: ["Gris"],
    description:
      "Gris ardoise chiné, manches larges et finitions fendues sur les côtés.",
    price_cents: 3990,
    is_featured: true,
  },
  {
    ...base,
    id: "demo-4",
    name: "Pull col montant Sable",
    slug: "pull-col-montant-sable",
    colors: ["Sable", "Écru"],
    description:
      "Le beige intemporel : une maille généreuse qui se porte toute l'année.",
    price_cents: 3990,
    is_featured: true,
  },
  {
    ...base,
    id: "demo-5",
    name: "Gilet long Écru",
    slug: "gilet-long-ecru",
    colors: ["Écru"],
    description: "Gilet long en grosse maille écrue, à superposer sans y penser.",
    price_cents: 4990,
    category: "Vestes & Manteaux",
    is_featured: false,
  },
  {
    ...base,
    id: "demo-6",
    name: "Pull torsadé Taupe",
    slug: "pull-torsade-taupe",
    colors: ["Taupe"],
    description: "Torsades classiques et teinte taupe, un basique qui dure.",
    price_cents: 4490,
    is_featured: false,
  },
];
