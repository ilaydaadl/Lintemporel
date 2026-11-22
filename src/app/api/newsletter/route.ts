import { NextResponse } from "next/server";
import { getServiceSupabase, getStripe } from "@/lib/server-clients";
import { addToBrevoList, sendWelcomeEmail } from "@/lib/brevo";
import { createWelcomeCode } from "@/lib/welcome";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status });

// Inscription « Soyez la première informée » + code de bienvenue personnel.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    website?: unknown;
  } | null;

  // Champ invisible : rempli seulement par les robots
  if (typeof body?.website === "string" && body.website.trim()) {
    return reply({ ok: true, code: null });
  }
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return reply({ ok: false, error: "Vérifiez votre adresse e-mail." }, 400);
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return reply({ ok: false, error: "Inscription indisponible pour le moment." }, 503);
  }

  // Déjà inscrite : on lui redonne son code (il ne sert qu'une fois)
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("welcome_code")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    // On renvoie l'e-mail de bienvenue (utile si elle a perdu son code)
    const code = existing.welcome_code ?? null;
    await Promise.allSettled([
      addToBrevoList(email).catch((e) => console.error(e)),
      sendWelcomeEmail(email, code, new URL(req.url).origin).catch((e) => console.error(e)),
    ]);
    return reply({ ok: true, already: true, code });
  }

  // Le code de bienvenue est réservé aux personnes qui n'ont jamais commandé
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("email", email)
    .neq("status", "remboursée")
    .limit(1);
  const alreadyCustomer = (orders?.length ?? 0) > 0;

  let code: string | null = null;
  const stripe = getStripe();
  if (!alreadyCustomer && stripe) {
    try {
      code = await createWelcomeCode(stripe, email);
    } catch (e) {
      console.error("Création du code de bienvenue impossible :", e);
    }
  }

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, welcome_code: code });
  if (error && error.code !== "23505") {
    console.error("Inscription newsletter impossible :", error.message);
    return reply({ ok: false, error: "L'inscription n'a pas fonctionné, réessayez." }, 500);
  }

  // Brevo : ajout à la liste + e-mail de bienvenue (une panne ne bloque pas l'inscription)
  const siteUrl = new URL(req.url).origin;
  await Promise.allSettled([
    addToBrevoList(email).catch((e) => console.error(e)),
    sendWelcomeEmail(email, code, siteUrl).catch((e) => console.error(e)),
  ]);

  return reply({ ok: true, code, alreadyCustomer });
}
