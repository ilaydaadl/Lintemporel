import { NextResponse } from "next/server";
import { getRequestUser, isAdminUser } from "@/lib/auth-server";
import { sendReturnDecisionEmail } from "@/lib/brevo";
import { LEGAL } from "@/lib/config";
import { getServiceSupabase } from "@/lib/server-clients";

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status });

// Admin : accepter ou refuser une demande de retour, et prévenir la cliente.
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  const supabase = getServiceSupabase();
  if (!user || !supabase) return reply({ error: "Non autorisé" }, 401);
  if (!(await isAdminUser(user.id))) return reply({ error: "Non autorisé" }, 403);

  const body = (await req.json().catch(() => null)) as {
    requestId?: unknown;
    decision?: unknown;
    note?: unknown;
  } | null;
  const decision = body?.decision;
  if (decision !== "acceptée" && decision !== "refusée") {
    return reply({ error: "Décision inconnue" }, 400);
  }
  const note =
    typeof body?.note === "string" ? body.note.trim().slice(0, 1000) || null : null;
  if (decision === "refusée" && !note) {
    return reply({ error: "Expliquez à la cliente pourquoi le retour est refusé." }, 400);
  }

  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const { data: request } = await supabase
    .from("return_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return reply({ error: "Demande introuvable" }, 404);
  if (request.status !== "en attente") return reply({ error: "Demande déjà traitée" }, 400);

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", request.order_id)
    .single();
  if (!order) return reply({ error: "Commande introuvable" }, 404);

  await supabase
    .from("return_requests")
    .update({ status: decision, admin_note: note, decided_at: new Date().toISOString() })
    .eq("id", requestId);
  await supabase
    .from("orders")
    .update({ status: decision === "acceptée" ? "retour accepté" : "livrée" })
    .eq("id", request.order_id);

  let emailError: string | null = null;
  try {
    await sendReturnDecisionEmail(
      order,
      decision === "acceptée",
      note,
      LEGAL.address,
      new URL(req.url).origin,
    );
  } catch (e) {
    console.error(e);
    emailError = e instanceof Error ? e.message : "E-mail non envoyé";
  }
  return reply({ ok: true, emailSent: !emailError, emailError });
}
