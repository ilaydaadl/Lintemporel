import { NextResponse } from "next/server";
import { checkPromo } from "@/lib/promo";
import { getStripe } from "@/lib/server-clients";

// Vérifie un code promo saisi dans le panier (le paiement le revérifie).
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Paiement indisponible." }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as {
    code?: unknown;
    email?: unknown;
    subtotalCents?: unknown;
  } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const subtotal =
    typeof body?.subtotalCents === "number" && body.subtotalCents >= 0
      ? Math.round(body.subtotalCents)
      : 0;
  const result = await checkPromo(stripe, code, email, subtotal);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  // L'identifiant Stripe reste côté serveur
  const { promotionCodeId: _id, ...publicResult } = result;
  void _id;
  return NextResponse.json(publicResult);
}
