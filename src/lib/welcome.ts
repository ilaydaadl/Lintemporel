// À n'importer QUE côté serveur : codes de bienvenue personnels (Stripe).
import type Stripe from "stripe";
import { OFFER } from "./config";

// Sans 0/O ni 1/I/L, pour éviter les erreurs de saisie
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 5) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Bon de réduction de bienvenue : le récupère, ou le crée s'il n'existe pas. */
async function welcomeCoupon(stripe: Stripe) {
  try {
    const coupon = await stripe.coupons.retrieve(OFFER.stripeCouponId);
    if (coupon.valid) return coupon.id;
  } catch {
    // inexistant : on le crée ci-dessous
  }
  const created = await stripe.coupons.create({
    id: OFFER.stripeCouponId,
    name: `Bienvenue −${OFFER.percent} %`,
    percent_off: OFFER.percent,
    duration: "once",
    metadata: { boutique: "lintemporel", usage: "bienvenue" },
  });
  return created.id;
}

/** Crée un code personnel valable une seule fois (ex. BIENVENUE-7KQ2M). */
export async function createWelcomeCode(stripe: Stripe, email: string) {
  const coupon = await welcomeCoupon(stripe);
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = `${OFFER.codePrefix}-${randomSuffix()}`;
    try {
      await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon },
        code,
        max_redemptions: 1,
        metadata: { email, usage: "bienvenue" },
      });
      return code;
    } catch (e) {
      // Code déjà pris (très rare) : on en tire un autre
      if (attempt === 2) throw e;
    }
  }
  throw new Error("Code impossible à créer");
}
