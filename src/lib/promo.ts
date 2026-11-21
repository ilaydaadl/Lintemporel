// À n'importer QUE côté serveur : vérification des codes promo Stripe.
import type Stripe from "stripe";
import { formatPrice, OFFER } from "./config";
import { getServiceSupabase } from "./server-clients";

export type PromoResult =
  | {
      ok: true;
      code: string;
      promotionCodeId: string;
      percentOff: number | null;
      amountOffCents: number | null;
      label: string;
    }
  | { ok: false; error: string };

/** Cette adresse a-t-elle déjà une commande payée (hors remboursement) ? */
export async function hasPreviousOrder(email: string) {
  const supabase = getServiceSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("email", email)
    .neq("status", "remboursée")
    .limit(1);
  if (error) {
    console.error("Vérification de première commande impossible :", error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 254;
}

/** Montant de la réduction pour un sous-total donné, en centimes. */
export function discountCents(
  promo: { percentOff: number | null; amountOffCents: number | null },
  subtotalCents: number,
) {
  if (promo.percentOff) return Math.round((subtotalCents * promo.percentOff) / 100);
  if (promo.amountOffCents) return Math.min(promo.amountOffCents, subtotalCents);
  return 0;
}

/**
 * Vérifie un code promo créé dans Stripe (Catalogue > Bons de réduction > codes promo).
 * Le code de bienvenue, et tout code marqué « premières commandes » dans Stripe,
 * est réservé aux adresses e-mail sans commande passée.
 */
export async function checkPromo(
  stripe: Stripe,
  rawCode: string,
  email: string,
  subtotalCents: number,
): Promise<PromoResult> {
  const code = rawCode.trim();
  if (!code || code.length > 64) return { ok: false, error: "Saisissez un code." };

  let promo: Stripe.PromotionCode | undefined;
  try {
    const list = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.promotion.coupon"],
    });
    promo = list.data[0];
  } catch (e) {
    console.error("Lecture des codes promo impossible :", e);
    return { ok: false, error: "Les codes promo sont indisponibles pour le moment." };
  }
  if (!promo) return { ok: false, error: "Ce code n'est pas valide." };

  const coupon = promo.promotion?.coupon;
  if (!coupon || typeof coupon === "string" || !coupon.valid) {
    return { ok: false, error: "Ce code a expiré." };
  }
  if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
    return { ok: false, error: "Ce code a expiré." };
  }
  const min = promo.restrictions?.minimum_amount;
  if (min && subtotalCents < min) {
    return {
      ok: false,
      error: `Ce code est valable dès ${formatPrice(min)} d'achat.`,
    };
  }

  const firstOrderOnly =
    promo.restrictions?.first_time_transaction ||
    promo.code.toUpperCase() === OFFER.code.toUpperCase();
  if (firstOrderOnly) {
    if (!isValidEmail(email)) {
      return {
        ok: false,
        error: "Indiquez votre adresse e-mail (rubrique Contact) pour utiliser ce code.",
      };
    }
    if (await hasPreviousOrder(email)) {
      return { ok: false, error: "Ce code est réservé à la première commande." };
    }
  }

  const percentOff = coupon.percent_off ?? null;
  const amountOffCents =
    coupon.amount_off && (coupon.currency ?? "eur") === "eur" ? coupon.amount_off : null;
  if (!percentOff && !amountOffCents) {
    return { ok: false, error: "Ce code n'est pas valide." };
  }
  return {
    ok: true,
    code: promo.code,
    promotionCodeId: promo.id,
    percentOff,
    amountOffCents,
    label: percentOff ? `−${percentOff} %` : `−${formatPrice(amountOffCents!)}`,
  };
}
