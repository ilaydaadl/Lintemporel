import { NextResponse } from "next/server";
import {
  SHIPPING,
  shippingCents,
  sizeLabel,
  type ShippingMethod,
} from "@/lib/config";
import { getProductsByIdsFresh } from "@/lib/products";
import { getStripe } from "@/lib/server-clients";
import type { Relay } from "@/lib/types";

type Line = {
  id: string;
  size: string | null;
  color: string | null;
  quantity: number;
};

function parseLines(body: unknown): Line[] | null {
  const raw = (body as { items?: unknown })?.items;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) return null;
  const lines: Line[] = [];
  for (const r of raw) {
    const { id, size, quantity } = (r ?? {}) as Record<string, unknown>;
    const color = ((r ?? {}) as Record<string, unknown>).color ?? null;
    if (color !== null && (typeof color !== "string" || color.length > 40))
      return null;
    if (typeof id !== "string" || id.length > 64) return null;
    if (size !== null && (typeof size !== "string" || size.length > 20))
      return null;
    if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 10)
      return null;
    lines.push({
      id,
      size: size as string | null,
      color: color as string | null,
      quantity: quantity as number,
    });
  }
  return lines;
}

/** Mode de livraison + point relais envoyés par le panier. */
function parseShipping(
  body: unknown,
): { method: ShippingMethod; relay: Relay | null } | null {
  const raw = (body as { shipping?: unknown })?.shipping as
    | { method?: unknown; relay?: unknown }
    | undefined;
  const method = raw?.method;
  if (method !== "relay" && method !== "home") return null;
  if (method === "home") return { method, relay: null };

  const r = (raw?.relay ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) =>
    typeof v === "string" && v.trim().length > 0 && v.length <= max
      ? v.trim()
      : null;
  const relay = {
    id: str(r.id, 20),
    name: str(r.name, 100),
    address: str(r.address, 200),
    postcode: str(r.postcode, 12),
    city: str(r.city, 100),
    country: str(r.country, 2),
  };
  if (Object.values(relay).some((v) => v === null)) return null;
  if (!SHIPPING.methods.relay.countries.includes(relay.country!)) return null;
  return { method, relay: relay as Relay };
}

const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return fail(
      "Le paiement n'est pas encore activé sur la boutique (clé Stripe manquante).",
      503,
    );
  }

  const body = await req.json().catch(() => null);
  const lines = parseLines(body);
  if (!lines) return fail("Panier invalide.");
  const shipping = parseShipping(body);
  if (!shipping) {
    return fail("Choisissez un mode de livraison et, si besoin, un point relais.");
  }
  const { method, relay } = shipping;
  const methodInfo = SHIPPING.methods[method];

  // Les prix et le stock viennent TOUJOURS de la base, jamais du navigateur.
  const products = await getProductsByIdsFresh([
    ...new Set(lines.map((l) => l.id)),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const wanted = new Map<string, number>();
  for (const line of lines) {
    const product = byId.get(line.id);
    if (!product) return fail("Un article de votre panier n'est plus disponible.");
    if (product.sizes.length > 0 && !product.sizes.includes(line.size ?? ""))
      return fail(`Taille indisponible pour « ${product.name} ».`);
    const colors = product.colors ?? [];
    if (colors.length > 0 && !colors.includes(line.color ?? ""))
      return fail(`Couleur indisponible pour « ${product.name} ».`);
    wanted.set(line.id, (wanted.get(line.id) ?? 0) + line.quantity);
  }
  for (const [id, quantity] of wanted) {
    const product = byId.get(id)!;
    if (product.stock < quantity) {
      return fail(
        product.stock <= 0
          ? `« ${product.name} » est épuisé.`
          : `Il ne reste que ${product.stock} exemplaire(s) de « ${product.name} ».`,
      );
    }
  }

  const subtotal = lines.reduce(
    (sum, l) => sum + byId.get(l.id)!.price_cents * l.quantity,
    0,
  );
  const shippingAmount = shippingCents(method, subtotal);
  const relayLine = relay
    ? `${relay.name}, ${relay.address}, ${relay.postcode} ${relay.city}`
    : "";
  const origin = new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    line_items: lines.map((l) => {
      const product = byId.get(l.id)!;
      const image = product.images[0];
      return {
        quantity: l.quantity,
        price_data: {
          currency: "eur",
          unit_amount: product.price_cents,
          product_data: {
            name: [
              product.name,
              l.color && (product.colors ?? []).includes(l.color) ? l.color : null,
              l.size ? sizeLabel(l.size) : null,
            ]
              .filter(Boolean)
              .join(" — "),
            ...(image?.startsWith("https://") ? { images: [image] } : {}),
            metadata: {
              product_id: product.id,
              size: l.size ?? "",
              color: l.color ?? "",
            },
          },
        },
      };
    }),
    // À domicile : Stripe demande l'adresse. En point relais : l'adresse est
    // celle du relais choisi dans le panier, on demande seulement le nom.
    ...(method === "home"
      ? {
          shipping_address_collection: {
            allowed_countries: methodInfo.countries as ("FR" | "BE" | "LU" | "CH")[],
          },
        }
      : {
          custom_fields: [
            {
              key: "destinataire",
              label: { type: "custom" as const, custom: "Nom et prénom du destinataire" },
              type: "text" as const,
            },
          ],
          custom_text: {
            submit: { message: `Livraison au point relais : ${relayLine}`.slice(0, 1200) },
          },
        }),
    phone_number_collection: { enabled: true },
    billing_address_collection: "required",
    // Champ « code promo » sur la page Stripe (ex. code de bienvenue -10 %)
    allow_promotion_codes: true,
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: (relay
            ? `${methodInfo.short} — ${relay.name}`
            : methodInfo.label
          ).slice(0, 100),
          fixed_amount: { amount: shippingAmount, currency: "eur" },
        },
      },
    ],
    metadata: {
      shipping_method: method,
      ...(relay
        ? {
            relay_id: relay.id,
            relay_name: relay.name,
            relay_address: relay.address,
            relay_postcode: relay.postcode,
            relay_city: relay.city,
            relay_country: relay.country,
          }
        : {}),
    },
    success_url: `${origin}/commande/succes`,
    cancel_url: `${origin}/panier`,
  });

  return NextResponse.json({ url: session.url });
}
