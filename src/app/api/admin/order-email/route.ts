import { NextResponse } from "next/server";
import { sendOrderEmail, type OrderEmailKind } from "@/lib/brevo";
import { trackingUrl } from "@/lib/config";
import { getServiceSupabase } from "@/lib/server-clients";

const STATUS: Record<OrderEmailKind, string> = {
  shipped: "expédiée",
  delivered: "livrée",
  refunded: "remboursée",
};

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status });

// Admin : change le statut d'une commande et prévient la cliente par e-mail.
export async function POST(req: Request) {
  const supabase = getServiceSupabase();
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!supabase || !token) return reply({ error: "Non autorisé" }, 401);

  // Réservé aux comptes de la table admins
  const { data: userData } = await supabase.auth.getUser(token);
  const userId = userData.user?.id;
  if (!userId) return reply({ error: "Non autorisé" }, 401);
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!admin) return reply({ error: "Non autorisé" }, 403);

  const body = (await req.json().catch(() => null)) as {
    orderId?: unknown;
    kind?: unknown;
    tracking?: unknown;
  } | null;
  const kind = body?.kind;
  if (kind !== "shipped" && kind !== "delivered" && kind !== "refunded") {
    return reply({ error: "Action inconnue" }, 400);
  }
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return reply({ error: "Commande introuvable" }, 404);

  const tracking =
    typeof body?.tracking === "string" && body.tracking.trim()
      ? body.tracking.trim().slice(0, 60)
      : order.tracking_number;
  if (kind === "shipped" && !tracking) {
    return reply({ error: "Ajoutez d'abord le numéro de suivi." }, 400);
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { status: STATUS[kind] };
  if (kind === "shipped") {
    updates.tracking_number = tracking;
    updates.shipped_at = order.shipped_at ?? now;
  }

  // E-mail à la cliente (la commande est mise à jour même si l'envoi échoue)
  let emailError: string | null = null;
  if (!order.email) {
    emailError = "Pas d'adresse e-mail pour cette commande.";
  } else {
    try {
      await sendOrderEmail(
        { ...order, tracking_number: tracking },
        kind,
        new URL(req.url).origin,
        tracking ? { url: trackingUrl(order.shipping_method, tracking) } : null,
      );
      updates.notifications = { ...(order.notifications ?? {}), [kind]: now };
    } catch (e) {
      console.error("E-mail de commande non envoyé :", e);
      emailError =
        e instanceof Error && e.message.includes("configuré")
          ? e.message
          : "L'e-mail n'a pas pu être envoyé (voir les journaux Vercel).";
    }
  }

  const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
  if (error) return reply({ error: error.message }, 500);

  return reply({ ok: true, emailSent: !emailError, emailError });
}
