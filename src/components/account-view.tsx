"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  canCancel,
  canRequestReturn,
  deliveryDate,
  formatPrice,
  LEGAL,
  ORDER_RULES,
  RETURN_REASONS,
  trackingUrl,
} from "@/lib/config";
import { useSession } from "@/lib/session";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Order, Product, ReturnRequest } from "@/lib/types";
import { ProductCard } from "./product-card";

/** Page « Mon compte » : connexion / inscription, puis commandes et favoris. */
export function AccountView() {
  const { session, ready } = useSession();
  const router = useRouter();
  const next = useSearchParams().get("suivant");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  // Une fois connectée, retour à la page d'où elle venait (favoris, panier…)
  useEffect(() => {
    if (session && safeNext) router.replace(safeNext);
  }, [session, safeNext, router]);

  if (!ready) return <div className="min-h-[60vh]" />;
  return session ? (
    <Dashboard
      email={session.user.email ?? ""}
      since={
        session.user.created_at
          ? new Date(session.user.created_at).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })
          : null
      }
    />
  ) : (
    <AuthForms />
  );
}

/* ------------------------------------------------------------ Connexion */

function AuthForms() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return setError("La connexion est indisponible pour le moment.");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    setInfo(null);
    const origin = window.location.origin;

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          /confirm/i.test(error.message)
            ? "Confirmez d'abord votre adresse grâce au lien reçu par e-mail."
            : "E-mail ou mot de passe incorrect.",
        );
      }
    } else if (mode === "signup") {
      if (password.length < 8) {
        setBusy(false);
        return setError("Choisissez un mot de passe d'au moins 8 caractères.");
      }
      if (password !== String(form.get("confirm") ?? "")) {
        setBusy(false);
        return setError("Les deux mots de passe ne sont pas identiques.");
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/compte` },
      });
      if (error) {
        setError(
          /registered|exists/i.test(error.message)
            ? "Un compte existe déjà avec cette adresse : connectez-vous."
            : "La création du compte n'a pas fonctionné. Réessayez plus tard.",
        );
      } else if (!data.session) {
        setInfo(
          "Presque fini ! Cliquez sur le lien que nous venons de vous envoyer par e-mail pour activer votre compte.",
        );
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/compte/nouveau-mot-de-passe`,
      });
      if (error) setError("L'envoi n'a pas fonctionné. Réessayez plus tard.");
      else setInfo("Si un compte existe avec cette adresse, vous allez recevoir un lien pour choisir un nouveau mot de passe.");
    }
    setBusy(false);
  }

  const titles = {
    login: "Se connecter",
    signup: "Créer un compte",
    reset: "Mot de passe oublié",
  };

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:px-8">
      <p className="eyebrow text-center text-muted">Mon compte</p>
      <h1 className="font-display mt-3 text-center text-5xl">{titles[mode]}</h1>
      <p className="mt-4 text-center text-sm text-muted">
        Retrouvez vos commandes et vos favoris, et payez plus vite.
      </p>

      {mode !== "reset" && (
        <div className="mt-8 grid grid-cols-2 border border-line text-sm">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
              }}
              className={`py-2.5 transition-colors ${
                mode === m ? "bg-ink text-cream" : "hover:bg-sand"
              }`}
            >
              {titles[m]}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm">
          Adresse e-mail
          <input name="email" type="email" required autoComplete="email" className="field mt-1 py-3" />
        </label>
        {mode !== "reset" && (
          <label className="block text-sm">
            Mot de passe
            <input
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="field mt-1 py-3"
            />
          </label>
        )}
        {mode === "signup" && (
          <label className="block text-sm">
            Confirmez le mot de passe
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field mt-1 py-3"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        {info && <p className="bg-sand p-3 text-sm">{info}</p>}
        {mode === "signup" && (
          <p className="text-xs text-muted">
            En créant un compte, vous acceptez notre{" "}
            <Link href="/confidentialite" className="underline underline-offset-4 hover:text-ink">
              politique de confidentialité
            </Link>
            .
          </p>
        )}
        <button className="btn btn-dark w-full py-3.5" disabled={busy}>
          {busy
            ? "…"
            : mode === "login"
              ? "Se connecter"
              : mode === "signup"
                ? "Créer mon compte"
                : "Recevoir le lien"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm">
        {mode === "reset" ? (
          <button type="button" className="underline underline-offset-4" onClick={() => setMode("login")}>
            Retour à la connexion
          </button>
        ) : (
          mode === "login" && (
            <button type="button" className="text-muted underline underline-offset-4 hover:text-ink" onClick={() => setMode("reset")}>
              Mot de passe oublié ?
            </button>
          )
        )}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ Espace cliente */

type Tab = "apercu" | "commandes" | "favoris" | "infos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "apercu", label: "Vue d'ensemble", icon: "M4 11.5 12 5l8 6.5V20h-5v-5h-6v5H4z" },
  { id: "commandes", label: "Mes commandes", icon: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" },
  { id: "favoris", label: "Mes favoris", icon: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" },
  { id: "infos", label: "Mes informations", icon: "M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" },
];

const STEPS = ["payée", "expédiée", "livrée"] as const;

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Prénom deviné à partir de l'e-mail (« camille.martin@… » → « Camille »). */
function firstName(email: string) {
  const part = email.split("@")[0]?.split(/[._\-+0-9]/)[0] ?? "";
  return part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : "";
}

function EmptyState({
  icon,
  title,
  text,
  cta,
}: {
  icon: string;
  title: string;
  text: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center border border-dashed border-line bg-white/40 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-taupe-dark">
        <Icon d={icon} className="h-6 w-6" />
      </span>
      <p className="font-display mt-4 text-2xl">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
      <Link href={cta.href} className="btn btn-dark mt-6">
        {cta.label}
      </Link>
    </div>
  );
}

function OrderTimeline({ status }: { status: string }) {
  if (status === "remboursée") {
    return <p className="text-xs text-muted">Commande remboursée</p>;
  }
  if (status === "annulée") {
    return <p className="text-xs text-muted">Commande annulée — remboursement en cours</p>;
  }
  const current =
    status === "retour demandé" || status === "retour accepté"
      ? STEPS.length - 1
      : Math.max(0, STEPS.indexOf(status as (typeof STEPS)[number]));
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label={`Statut : ${status}`}>
      {STEPS.map((step, i) => (
        <li key={step}>
          <div className={`h-1 rounded-full ${i <= current ? "bg-ink" : "bg-line"}`} />
          <p className={`mt-1.5 text-[11px] capitalize ${i <= current ? "text-ink" : "text-muted"}`}>
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}

function ReturnStatus({ request }: { request: ReturnRequest }) {
  const tone =
    request.status === "acceptée"
      ? "bg-emerald-50"
      : request.status === "refusée"
        ? "bg-red-50"
        : "bg-sand";
  return (
    <div className={`mt-4 p-3 text-sm ${tone}`}>
      <p className="font-medium">
        {request.status === "en attente"
          ? "Demande de retour envoyée — en cours d'examen"
          : request.status === "acceptée"
            ? "Retour accepté"
            : "Retour refusé"}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {request.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")} · Motif : {request.reason}
      </p>
      {request.admin_note && <p className="mt-2 whitespace-pre-line">{request.admin_note}</p>}
      {request.status === "acceptée" && (
        <p className="mt-2 text-xs">
          Renvoyez le ou les articles (non portés) sous 14 jours à : {LEGAL.address}. Le
          remboursement est effectué dès réception. Les instructions vous ont aussi été envoyées
          par e-mail.
        </p>
      )}
    </div>
  );
}

function OrderCard({
  order: o,
  request,
  onChange,
}: {
  order: Order;
  request?: ReturnRequest;
  onChange: () => void;
}) {
  const { session } = useSession();
  const [mode, setMode] = useState<"idle" | "cancel" | "return">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const count = o.items.reduce((n, it) => n + it.quantity, 0);
  const cancellable = canCancel(o);
  const returnable = canRequestReturn(o) && !request;
  const cancelUntil = new Date(
    new Date(o.created_at).getTime() + ORDER_RULES.cancelHours * 3_600_000,
  );
  const delivered = deliveryDate(o);
  const returnUntil = delivered
    ? new Date(new Date(delivered).getTime() + ORDER_RULES.returnDays * 86_400_000)
    : null;

  async function send(path: string, payload: Record<string, unknown>) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId: o.id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue.");
      setMode("idle");
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="border border-line bg-white/70 p-5 transition-shadow hover:shadow-[0_12px_30px_-20px_rgba(59,48,42,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            Commande du {new Date(o.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
          </p>
          <p className="mt-0.5 font-medium">
            {count} article{count > 1 ? "s" : ""} · {formatPrice(o.amount_total_cents)}
          </p>
        </div>
        <span className="rounded-full bg-sand px-3 py-1 text-xs capitalize">{o.status}</span>
      </div>
      <ul className="mt-3 space-y-0.5 text-sm text-muted">
        {o.items.map((it, i) => (
          <li key={i}>
            {it.quantity} × {it.name}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <OrderTimeline status={o.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
        <span>
          {o.shipping_method === "relay" && o.relay
            ? `Point relais : ${o.relay.name}, ${o.relay.city}`
            : o.shipping_method === "home"
              ? "Livraison à domicile"
              : ""}
        </span>
        {o.tracking_number && (
          <a
            href={trackingUrl(o.shipping_method, o.tracking_number)}
            target="_blank"
            rel="noreferrer"
            className="font-normal text-ink underline underline-offset-4"
          >
            Suivre mon colis →
          </a>
        )}
      </div>

      {request && <ReturnStatus request={request} />}

      {/* Annulation */}
      {cancellable && mode !== "return" && (
        <div className="mt-4">
          {mode === "cancel" ? (
            <div className="flex flex-wrap items-center gap-3 bg-red-50 p-3 text-sm text-red-900">
              Annuler cette commande ? Vous serez remboursée.
              <button
                type="button"
                className="bg-red-800 px-3 py-1.5 text-white disabled:opacity-50"
                disabled={busy}
                onClick={() => send("/api/account/cancel", {})}
              >
                {busy ? "Annulation…" : "Oui, annuler"}
              </button>
              <button type="button" className="underline" onClick={() => setMode("idle")}>
                Non, garder
              </button>
            </div>
          ) : (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <button
                type="button"
                className="border border-line bg-white px-3 py-1.5 text-sm text-ink hover:border-ink"
                onClick={() => setMode("cancel")}
              >
                Annuler ma commande
              </button>
              Possible jusqu&apos;au{" "}
              {cancelUntil.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })},
              tant qu&apos;elle n&apos;est pas expédiée.
            </p>
          )}
        </div>
      )}

      {/* Demande de retour */}
      {returnable && (
        <div className="mt-4">
          {mode === "return" ? (
            <form
              className="space-y-3 border border-line bg-cream p-4 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                const items = Object.entries(chosen)
                  .filter(([, q]) => q > 0)
                  .map(([index, quantity]) => ({ index: Number(index), quantity }));
                if (items.length === 0) return setError("Choisissez au moins un article.");
                if (!reason) return setError("Choisissez un motif.");
                send("/api/account/return", { items, reason, message });
              }}
            >
              <p className="font-medium">Demander un retour</p>
              <fieldset>
                <legend className="mb-1 text-xs text-muted">Articles à retourner</legend>
                {o.items.map((it, i) => (
                  <label key={i} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={(chosen[i] ?? 0) > 0}
                      onChange={(e) =>
                        setChosen((c) => ({ ...c, [i]: e.target.checked ? it.quantity : 0 }))
                      }
                      className="accent-[#3b302a]"
                    />
                    <span className="flex-1">{it.name}</span>
                    {it.quantity > 1 && (chosen[i] ?? 0) > 0 && (
                      <select
                        value={chosen[i]}
                        onChange={(e) => setChosen((c) => ({ ...c, [i]: Number(e.target.value) }))}
                        className="field w-auto py-0.5"
                        aria-label={`Quantité de ${it.name}`}
                      >
                        {Array.from({ length: it.quantity }, (_, k) => k + 1).map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                ))}
              </fieldset>
              <label className="block">
                <span className="text-xs text-muted">Motif</span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="field mt-1 py-2"
                  required
                >
                  <option value="">Choisir un motif…</option>
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted">
                  Précisions {reason === "Autre" ? "(obligatoire)" : "(facultatif)"}
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="field mt-1"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-dark px-5 py-2" disabled={busy}>
                  {busy ? "Envoi…" : "Envoyer la demande"}
                </button>
                <button type="button" className="btn btn-outline px-5 py-2" onClick={() => setMode("idle")}>
                  Annuler
                </button>
              </div>
              <p className="text-xs text-muted">
                Les frais de retour sont à votre charge. Nous vous répondons par e-mail avec la marche à suivre.
              </p>
            </form>
          ) : (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <button
                type="button"
                className="border border-line bg-white px-3 py-1.5 text-sm text-ink hover:border-ink"
                onClick={() => setMode("return")}
              >
                Demander un retour
              </button>
              {returnUntil && (
                <>Possible jusqu&apos;au {returnUntil.toLocaleDateString("fr-FR", { dateStyle: "long" })}.</>
              )}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-800">{error}</p>}
    </li>
  );
}

function Dashboard({ email, since }: { email: string; since: string | null }) {
  const [tab, setTab] = useState<Tab>("apercu");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [returns, setReturns] = useState<Record<string, ReturnRequest>>({});
  const [reload, setReload] = useState(0);
  const [favorites, setFavorites] = useState<Product[] | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const name = firstName(email);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let active = true;
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => active && setOrders((data as Order[]) ?? []));
    supabase
      .from("return_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        const byOrder: Record<string, ReturnRequest> = {};
        for (const r of (data as ReturnRequest[]) ?? []) byOrder[r.order_id] ??= r;
        setReturns(byOrder);
      });
    supabase
      .from("favorites")
      .select("created_at, products(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        const list = (data ?? [])
          .map((r) => (r as unknown as { products: Product | null }).products)
          .filter((p): p is Product => !!p && p.is_active);
        setFavorites(list);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const lastOrder = orders?.[0];
  const inProgress = orders?.filter((o) => o.status === "payée" || o.status === "expédiée").length ?? 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:py-14">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-5 bg-sand p-6 sm:p-8">
        <span className="font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink text-3xl text-cream">
          {(name || email).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-muted">Mon espace</p>
          <h1 className="font-display mt-1 text-4xl sm:text-5xl">
            Bonjour{name ? ` ${name}` : ""}
          </h1>
          <p className="mt-1 truncate text-sm text-muted">
            {email}
            {since && <> · Cliente depuis {since}</>}
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
          {[
            { label: "Commandes", value: orders?.length ?? "–" },
            { label: "En cours", value: orders ? inProgress : "–" },
            { label: "Favoris", value: favorites?.length ?? "–" },
          ].map((s) => (
            <div key={s.label} className="min-w-24 bg-cream/80 px-4 py-3 text-center">
              <p className="font-display text-3xl leading-none">{s.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr] lg:gap-12">
        {/* Navigation */}
        <nav aria-label="Mon espace" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors lg:rounded-none lg:border-l-2 lg:px-4 ${
                tab === t.id
                  ? "bg-ink text-cream lg:border-ink lg:bg-sand lg:text-ink"
                  : "border border-line bg-white/50 hover:bg-sand lg:border-0 lg:border-l-2 lg:border-transparent lg:bg-transparent"
              }`}
            >
              <Icon d={t.icon} className="h-[18px] w-[18px]" />
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => getBrowserSupabase()?.auth.signOut()}
            className="flex shrink-0 items-center gap-3 rounded-full border border-line px-4 py-2.5 text-sm text-muted hover:text-ink lg:mt-4 lg:rounded-none lg:border-0 lg:border-t lg:pt-5"
          >
            <Icon d="M15 12H4m0 0 4-4m-4 4 4 4M13 5h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" className="h-[18px] w-[18px]" />
            Se déconnecter
          </button>
        </nav>

        {/* Contenu */}
        <div className="min-w-0">
          {tab === "apercu" && (
            <div className="space-y-10">
              <div>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="font-display text-3xl">Dernière commande</h2>
                  {orders && orders.length > 1 && (
                    <button type="button" className="text-sm underline underline-offset-4" onClick={() => setTab("commandes")}>
                      Tout voir
                    </button>
                  )}
                </div>
                {orders === null ? (
                  <div className="h-40 animate-pulse bg-sand" />
                ) : lastOrder ? (
                  <ul>
                    <OrderCard order={lastOrder} request={returns[lastOrder.id]} onChange={() => setReload((r) => r + 1)} />
                  </ul>
                ) : (
                  <EmptyState
                    icon={TABS[1].icon}
                    title="Pas encore de commande"
                    text="Vos commandes passées en étant connectée apparaîtront ici, avec leur suivi."
                    cta={{ href: "/nouveautes", label: "Découvrir les nouveautés" }}
                  />
                )}
              </div>

              <div>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="font-display text-3xl">Mes favoris</h2>
                  {favorites && favorites.length > 3 && (
                    <button type="button" className="text-sm underline underline-offset-4" onClick={() => setTab("favoris")}>
                      Tout voir
                    </button>
                  )}
                </div>
                {favorites === null ? (
                  <div className="h-40 animate-pulse bg-sand" />
                ) : favorites.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
                    {favorites.slice(0, 3).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={TABS[2].icon}
                    title="Aucun favori pour l'instant"
                    text="Touchez le cœur d'un article pour le garder de côté et le retrouver ici."
                    cta={{ href: "/boutique", label: "Parcourir la boutique" }}
                  />
                )}
              </div>
            </div>
          )}

          {tab === "commandes" && (
            <div>
              <h2 className="font-display mb-4 text-3xl">Mes commandes</h2>
              {orders === null ? (
                <div className="h-40 animate-pulse bg-sand" />
              ) : orders.length > 0 ? (
                <ul className="space-y-4">
                  {orders.map((o) => (
                    <OrderCard key={o.id} order={o} request={returns[o.id]} onChange={() => setReload((r) => r + 1)} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={TABS[1].icon}
                  title="Pas encore de commande"
                  text="Vos commandes passées en étant connectée apparaîtront ici, avec leur suivi."
                  cta={{ href: "/nouveautes", label: "Découvrir les nouveautés" }}
                />
              )}
            </div>
          )}

          {tab === "favoris" && (
            <div>
              <h2 className="font-display mb-4 text-3xl">Mes favoris</h2>
              {favorites === null ? (
                <div className="h-40 animate-pulse bg-sand" />
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                  {favorites.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={TABS[2].icon}
                  title="Aucun favori pour l'instant"
                  text="Touchez le cœur d'un article pour le garder de côté et le retrouver ici."
                  cta={{ href: "/boutique", label: "Parcourir la boutique" }}
                />
              )}
            </div>
          )}

          {tab === "infos" && (
            <div className="max-w-xl">
              <h2 className="font-display mb-4 text-3xl">Mes informations</h2>
              <dl className="divide-y divide-line border-y border-line text-sm">
                <div className="flex flex-wrap justify-between gap-2 py-4">
                  <dt className="text-muted">Adresse e-mail</dt>
                  <dd>{email}</dd>
                </div>
                {since && (
                  <div className="flex flex-wrap justify-between gap-2 py-4">
                    <dt className="text-muted">Cliente depuis</dt>
                    <dd className="capitalize">{since}</dd>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 py-4">
                  <dt className="text-muted">Mot de passe</dt>
                  <dd>
                    {resetSent ? (
                      <span className="text-muted">Lien envoyé par e-mail ✓</span>
                    ) : (
                      <button
                        type="button"
                        className="underline underline-offset-4"
                        onClick={async () => {
                          await getBrowserSupabase()?.auth.resetPasswordForEmail(email, {
                            redirectTo: `${window.location.origin}/compte/nouveau-mot-de-passe`,
                          });
                          setResetSent(true);
                        }}
                      >
                        Modifier mon mot de passe
                      </button>
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-sm text-muted">
                Une question sur une commande ?{" "}
                <Link href="/contact" className="text-ink underline underline-offset-4">
                  Contactez-nous
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
