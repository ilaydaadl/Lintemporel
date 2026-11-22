import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { sendReturnReceivedEmail, sendShopAlert } from "@/lib/brevo";
import { canRequestReturn, ORDER_RULES, RETURN_REASONS } from "@/lib/config";
import { getServiceSupabase } from "@/lib/server-clients";
import type { OrderItem } from "@/lib/types";

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Cliente : demander le retour d'articles d'une commande livrée.
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  const supabase = getServiceSupabase();
  if (!user || !supabase) {
    return reply({ error: "Connectez-vous pour demander un retour." }, 401);
  }

  const body = (await req.json().catch(() => null)) as {
    orderId?: unknown;
    items?: unknown;
    reason?: unknown;
    message?: unknown;
  } | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
  if (!(RETURN_REASONS as readonly string[]).includes(reason)) {
    return reply({ error: "Choisissez un motif." }, 400);
  }
  if (reason === "Autre" && !message) {
    return reply({ error: "Précisez le motif de votre retour." }, 400);
  }

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== user.id) return reply({ error: "Commande introuvable." }, 404);
  if (!canRequestReturn(order)) {
    return reply(
      {
        error:
          order.status === "livrée"
            ? `Le délai de retour de ${ORDER_RULES.returnDays} jours est dépassé. Contactez-nous.`
            : "Un retour n'est pas possible pour cette commande.",
      },
      400,
    );
  }

  // Articles demandés : uniquement ceux de la commande, quantités plafonnées
  const orderItems = (order.items ?? []) as OrderItem[];
  const wanted = Array.isArray(body?.items)
    ? (body.items as { index?: unknown; quantity?: unknown }[])
    : [];
  const items = wanted
    .map((w) => {
      const it = orderItems[Number(w.index)];
      const q = Math.floor(Number(w.quantity));
      return it && q > 0
        ? { product_id: it.product_id, name: it.name, quantity: Math.min(q, it.quantity) }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  if (items.length === 0) return reply({ error: "Choisissez au moins un article." }, 400);

  const { error } = await supabase.from("return_requests").insert({
    order_id: order.id,
    user_id: user.id,
    items,
    reason,
    message: message || null,
  });
  if (error) return reply({ error: "La demande n'a pas pu être enregistrée." }, 500);
  await supabase.from("orders").update({ status: "retour demandé" }).eq("id", order.id);

  const siteUrl = new URL(req.url).origin;
  await Promise.allSettled([
    sendReturnReceivedEmail(order, siteUrl).catch((e) => console.error(e)),
    sendShopAlert(
      "Nouvelle demande de retour",
      [
        `<strong>${esc(order.customer_name ?? order.email ?? "Une cliente")}</strong> demande un retour.`,
        `Articles : ${items.map((i) => `${i.quantity} × ${esc(i.name)}`).join(", ")}`,
        `Motif : ${esc(reason)}${message ? ` — « ${esc(message)} »` : ""}`,
        "À faire : accepter ou refuser la demande dans l'admin (onglet Commandes).",
      ],
      siteUrl,
    ).catch((e) => console.error(e)),
  ]);
  return reply({ ok: true });
}
