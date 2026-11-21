import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getServiceSupabase, getStripe } from "@/lib/server-clients";
import type { OrderItem } from "@/lib/types";

// Stripe appelle cette adresse quand un paiement aboutit.
// La signature garantit que l'appel vient bien de Stripe.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabase = getServiceSupabase();
  if (!stripe || !secret || !supabase) {
    return NextResponse.json({ error: "Non configuré" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      secret,
    );
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });
  const items: OrderItem[] = lineItems.data.map((li) => {
    const product = li.price?.product as Stripe.Product | undefined;
    return {
      product_id: product?.metadata?.product_id || null,
      name: li.description ?? product?.name ?? "Article",
      size: product?.metadata?.size || null,
      color: product?.metadata?.color || null,
      quantity: li.quantity ?? 1,
      unit_amount_cents: li.price?.unit_amount ?? 0,
    };
  });

  const shipping = session.collected_information?.shipping_details;
  const meta = session.metadata ?? {};
  const method = meta.shipping_method === "home" ? "home" : meta.shipping_method === "relay" ? "relay" : null;
  const relay =
    method === "relay" && meta.relay_id
      ? {
          id: meta.relay_id,
          name: meta.relay_name ?? "",
          address: meta.relay_address ?? "",
          postcode: meta.relay_postcode ?? "",
          city: meta.relay_city ?? "",
          country: meta.relay_country ?? "FR",
        }
      : null;
  const recipient = session.custom_fields
    ?.find((f) => f.key === "destinataire")
    ?.text?.value?.trim();

  // stripe_session_id est unique : si Stripe renvoie l'évènement, rien n'est dupliqué.
  const { data: inserted, error } = await supabase
    .from("orders")
    .upsert(
      {
        stripe_session_id: session.id,
        email: session.customer_details?.email?.trim().toLowerCase() ?? null,
        customer_name:
          recipient || shipping?.name || session.customer_details?.name || null,
        shipping_method: method,
        user_id: /^[0-9a-f-]{36}$/i.test(meta.user_id ?? "") ? meta.user_id : null,
        relay,
        phone: session.customer_details?.phone ?? null,
        billing_address: session.customer_details?.address ?? null,
        amount_total_cents: session.amount_total ?? 0,
        shipping_address: shipping?.address ?? null,
        items,
        status: "payée",
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    console.error("Enregistrement de la commande impossible :", error.message);
    return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
  }

  if (inserted && inserted.length > 0) {
    for (const item of items) {
      if (!item.product_id) continue;
      const { error: stockError } = await supabase.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
      if (stockError) console.error("Stock non mis à jour :", stockError.message);
    }
    revalidateTag("products", { expire: 0 });
  }

  return NextResponse.json({ received: true });
}
