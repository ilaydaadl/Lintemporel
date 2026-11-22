import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { sendCancelledEmail, sendShopAlert } from "@/lib/brevo";
import { canCancel, formatPrice, ORDER_RULES } from "@/lib/config";
import { getServiceSupabase } from "@/lib/server-clients";

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Cliente : annuler sa commande (tant qu'elle n'est pas expédiée, dans le délai).
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  const supabase = getServiceSupabase();
  if (!user || !supabase) {
    return reply({ error: "Connectez-vous pour annuler une commande." }, 401);
  }

  const body = (await req.json().catch(() => null)) as { orderId?: unknown } | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return reply({ error: "Commande introuvable." }, 404);
  if (!canCancel(order)) {
    return reply(
      {
        error:
          order.status === "payée"
            ? `Le délai d'annulation de ${ORDER_RULES.cancelHours} h est dépassé. Contactez-nous.`
            : "Cette commande ne peut plus être annulée.",
      },
      400,
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      status: "annulée",
      notifications: { ...(order.notifications ?? {}), cancelled: now },
    })
    .eq("id", orderId)
    .eq("status", "payée") // évite une annulation pendant une expédition simultanée
    .select("id");
  if (error || !updated?.length) {
    return reply({ error: "L'annulation n'a pas fonctionné. Contactez-nous." }, 409);
  }

  const siteUrl = new URL(req.url).origin;
  await Promise.allSettled([
    sendCancelledEmail(order, siteUrl).catch((e) => console.error(e)),
    sendShopAlert(
      "Commande annulée par la cliente",
      [
        `<strong>${esc(order.customer_name ?? order.email ?? "Une cliente")}</strong> a annulé sa commande de ${formatPrice(order.amount_total_cents)}.`,
        "À faire : rembourser le paiement dans Stripe, puis cliquer sur « Remboursée » dans l'admin.",
      ],
      siteUrl,
    ).catch((e) => console.error(e)),
  ]);
  return reply({ ok: true });
}
