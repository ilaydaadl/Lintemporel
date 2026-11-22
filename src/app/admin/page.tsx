"use client";
/* eslint-disable @next/next/no-img-element */

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CATEGORIES,
  categoryByLabel,
  colorHex,
  COLORS,
  formatPrice,
  ORDER_STATUSES,
  paletteHex,
  SITE,
  trackingUrl,
} from "@/lib/config";
import { IDLE, useIdleTimeout } from "@/lib/idle";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { ColorOptions, Order, Product, ReturnRequest } from "@/lib/types";

type AdminTab = "apercu" | "articles" | "commandes" | "newsletter";

const NAV: { id: AdminTab; label: string; icon: string }[] = [
  { id: "apercu", label: "Tableau de bord", icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" },
  { id: "articles", label: "Articles", icon: "M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3h-2a2 2 0 0 1-4 0H8Z" },
  { id: "commandes", label: "Commandes", icon: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" },
  { id: "newsletter", label: "Newsletter", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
];

function AdminIcon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function AdminPage() {
  const supabase = getBrowserSupabase();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [adminCheck, setAdminCheck] = useState<{
    userId: string;
    ok: boolean;
  } | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const userId = session?.user.id;
  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setAdminCheck({ userId, ok: Boolean(data) });
      });
    return () => {
      active = false;
    };
  }, [supabase, userId]);
  const isAdmin = adminCheck && adminCheck.userId === userId ? adminCheck.ok : null;

  // Sécurité : déconnexion après 30 minutes d'inactivité dans l'admin
  const idle = useIdleTimeout({
    storageKey: IDLE.admin.key,
    timeoutMs: IDLE.admin.timeoutMs,
    warnBeforeMs: IDLE.admin.warnBeforeMs,
    enabled: !!session && isAdmin === true,
    onTimeout: () => {
      setTimedOut(true);
      supabase?.auth.signOut();
    },
  });

  if (!supabase) {
    return (
      <p className="p-8">
        Supabase n&apos;est pas encore connecté. Renseignez les variables
        d&apos;environnement (voir le fichier README) puis relancez le site.
      </p>
    );
  }
  if (session === undefined) return <p className="p-8 text-muted">Chargement…</p>;
  if (!session) return <Login supabase={supabase} timedOut={timedOut} />;
  if (isAdmin === null) return <p className="p-8 text-muted">Vérification des droits…</p>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-display text-3xl">Accès réservé</p>
        <p className="mt-3 text-muted">
          Le compte {session.user.email} n&apos;a pas les droits d&apos;administration.
        </p>
        <button type="button" className="btn btn-outline mt-6" onClick={() => supabase.auth.signOut()}>
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <>
      <Dashboard
        supabase={supabase}
        token={session.access_token}
        email={session.user.email ?? ""}
      />
      {idle.secondsLeft !== null && (
        <div role="alertdialog" aria-live="assertive" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md border border-line bg-white p-5 shadow-2xl sm:left-auto sm:right-6">
          <p className="font-medium">Toujours là ?</p>
          <p className="mt-1 text-sm text-muted">
            Par sécurité, vous allez être déconnectée dans {idle.secondsLeft} s.
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" className="btn btn-dark px-5 py-2" onClick={idle.stayActive}>
              Rester connectée
            </button>
            <button type="button" className="btn btn-outline px-5 py-2" onClick={() => supabase.auth.signOut()}>
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Login({ supabase, timedOut }: { supabase: SupabaseClient; timedOut: boolean }) {
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: String(form.get("password")),
      });
      if (error) setError("E-mail ou mot de passe incorrect.");
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/compte/nouveau-mot-de-passe?retour=/admin`,
      });
      if (error) setError("L'envoi n'a pas fonctionné. Réessayez dans quelques minutes.");
      else setInfo("Si cette adresse correspond à un compte, un lien pour choisir un nouveau mot de passe vient d'être envoyé.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4 py-12">
      <div className="w-full max-w-sm bg-cream p-8 shadow-[0_20px_60px_-30px_rgba(59,48,42,0.5)]">
        <p className="font-display text-center text-3xl">{SITE.name}</p>
        <p className="eyebrow mt-1 text-center text-muted">Administration</p>
        {timedOut && (
          <p className="mt-6 bg-sand p-3 text-sm">
            Vous avez été déconnectée après 30 minutes d&apos;inactivité.
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm">
            E-mail
            <input name="email" type="email" required autoComplete="email" className="field mt-1 py-3" />
          </label>
          {mode === "login" && (
            <label className="block text-sm">
              Mot de passe
              <input name="password" type="password" required autoComplete="current-password" className="field mt-1 py-3" />
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          )}
          {info && <p className="bg-sand p-3 text-sm">{info}</p>}
          <button className="btn btn-dark w-full py-3" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Se connecter" : "Recevoir le lien"}
          </button>
        </form>
        <div className="mt-5 flex justify-between text-sm">
          <button
            type="button"
            className="text-muted underline underline-offset-4 hover:text-ink"
            onClick={() => {
              setMode(mode === "login" ? "reset" : "login");
              setError(null);
              setInfo(null);
            }}
          >
            {mode === "login" ? "Mot de passe oublié ?" : "Retour à la connexion"}
          </button>
          <Link href="/" className="text-muted underline underline-offset-4 hover:text-ink">
            Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  supabase,
  token,
  email,
}: {
  supabase: SupabaseClient;
  token: string;
  email: string;
}) {
  const [tab, setTab] = useState<AdminTab>("apercu");
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Barre latérale (ordinateur) / barre du haut (mobile) */}
      <aside className="bg-ink text-cream lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-7">
          <div>
            <p className="font-display text-2xl leading-none">{SITE.name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-cream/50">Administration</p>
          </div>
          <Link href="/" className="text-xs text-cream/70 underline underline-offset-4 lg:hidden">
            Boutique
          </Link>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:px-3 lg:pb-0">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setTab(n.id)}
              aria-current={tab === n.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                tab === n.id ? "bg-cream text-ink" : "text-cream/75 hover:bg-cream/10 hover:text-cream"
              }`}
            >
              <AdminIcon d={n.icon} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-cream/10 px-6 py-5 text-sm lg:block">
          <p className="truncate text-xs text-cream/50">{email}</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/" className="text-cream/75 hover:text-cream">
              ↗ Voir la boutique
            </Link>
            <button type="button" className="text-left text-cream/75 hover:text-cream" onClick={() => supabase.auth.signOut()}>
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-cream px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display mb-8 text-4xl">{NAV.find((n) => n.id === tab)?.label}</h1>
          {tab === "apercu" ? (
            <Overview supabase={supabase} onNavigate={setTab} />
          ) : tab === "articles" ? (
            <Products supabase={supabase} token={token} />
          ) : tab === "commandes" ? (
            <Orders supabase={supabase} token={token} />
          ) : (
            <Newsletter supabase={supabase} />
          )}
          <button
            type="button"
            className="mt-12 text-sm text-muted underline underline-offset-4 lg:hidden"
            onClick={() => supabase.auth.signOut()}
          >
            Se déconnecter
          </button>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------ Tableau de bord ------------------------------ */

function Overview({
  supabase,
  onNavigate,
}: {
  supabase: SupabaseClient;
  onNavigate: (tab: AdminTab) => void;
}) {
  const [data, setData] = useState<{
    orders: Order[];
    products: Product[];
    subscribers: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("products").select("*"),
      supabase.from("newsletter_subscribers").select("email", { count: "exact", head: true }),
    ]).then(([o, p, n]) => {
      if (!active) return;
      setData({
        orders: (o.data as Order[]) ?? [],
        products: (p.data as Product[]) ?? [],
        subscribers: n.count ?? 0,
      });
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  if (!data) return <div className="h-40 animate-pulse bg-sand" />;

  const paid = data.orders.filter((o) => o.status !== "remboursée");
  const revenue = paid.reduce((n, o) => n + o.amount_total_cents, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue = paid
    .filter((o) => new Date(o.created_at) >= monthStart)
    .reduce((n, o) => n + o.amount_total_cents, 0);
  const toShip = data.orders.filter((o) => o.status === "payée");
  const toHandle = data.orders.filter(
    (o) => o.status === "annulée" || o.status === "retour demandé",
  );
  const online = data.products.filter((p) => p.is_active);
  const lowStock = online.filter((p) => p.stock <= 3).sort((a, b) => a.stock - b.stock);

  const stats = [
    { label: "Ventes du mois", value: formatPrice(monthRevenue), hint: `${formatPrice(revenue)} au total` },
    { label: "À expédier", value: String(toShip.length), hint: toHandle.length ? `+ ${toHandle.length} annulation(s) ou retour(s) à traiter` : "commandes payées", tab: "commandes" as AdminTab, alert: toShip.length + toHandle.length > 0 },
    { label: "Articles en ligne", value: String(online.length), hint: `${lowStock.length} en stock faible`, tab: "articles" as AdminTab },
    { label: "Inscrites newsletter", value: String(data.subscribers), hint: "abonnées", tab: "newsletter" as AdminTab },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={!s.tab}
            onClick={() => s.tab && onNavigate(s.tab)}
            className="border border-line bg-white p-5 text-left transition-shadow enabled:hover:shadow-[0_12px_30px_-20px_rgba(59,48,42,0.5)]"
          >
            <p className="text-xs uppercase tracking-wider text-muted">{s.label}</p>
            <p className={`font-display mt-2 text-4xl leading-none ${s.alert ? "text-red-800" : ""}`}>{s.value}</p>
            <p className="mt-2 text-xs text-muted">{s.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-line bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">À expédier</h2>
            <button type="button" className="text-sm underline underline-offset-4" onClick={() => onNavigate("commandes")}>
              Voir les commandes
            </button>
          </div>
          {toShip.length === 0 ? (
            <p className="text-sm text-muted">Rien à expédier pour le moment ✓</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {toShip.slice(0, 6).map((o) => (
                <li key={o.id} className="flex justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate">
                    {o.customer_name ?? o.email ?? "Cliente"}
                    <span className="text-muted"> · {o.shipping_method === "relay" ? "Point relais" : "Domicile"}</span>
                  </span>
                  <span className="shrink-0">{formatPrice(o.amount_total_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-line bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Stock faible</h2>
            <button type="button" className="text-sm underline underline-offset-4" onClick={() => onNavigate("articles")}>
              Voir les articles
            </button>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">Tous les articles ont plus de 3 pièces en stock ✓</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${p.stock === 0 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>
                    {p.stock === 0 ? "Épuisé" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------ Articles ------------------------------ */

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "article"}-${Math.random().toString(36).slice(2, 6)}`;
}

function Products({
  supabase,
  token,
}: {
  supabase: SupabaseClient;
  token: string;
}) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setProducts(data as Product[]);
      });
    return () => {
      active = false;
    };
  }, [supabase, version]);

  async function changed() {
    setEditing(null);
    setVersion((v) => v + 1);
    // Demande à la boutique d'afficher tout de suite le catalogue à jour
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  // Confirmation affichée dans la page : les fenêtres window.confirm sont
  // bloquées par certains navigateurs intégrés, ce qui annulait la suppression.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(product: Product) {
    setDeletingId(product.id);
    setError(null);
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .select("id");
    setDeletingId(null);
    setConfirmingId(null);
    if (error) return setError(`Suppression impossible : ${error.message}`);
    if (!data || data.length === 0) {
      return setError(
        "Suppression refusée : ce compte n'a pas les droits, ou l'article n'existe plus.",
      );
    }
    const paths = product.images
      .map((u) => u.split("/object/public/products/")[1])
      .filter(Boolean);
    if (paths.length > 0) await supabase.storage.from("products").remove(paths);
    await changed();
  }

  if (editing) {
    return (
      <ProductForm
        supabase={supabase}
        product={editing === "new" ? null : editing}
        onDone={changed}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const q = search.trim().toLowerCase();
  const visible = (products ?? []).filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q),
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article ou une catégorie"
            aria-label="Rechercher un article"
            className="field py-2.5 pl-9"
          />
        </div>
        <button type="button" className="btn btn-dark" onClick={() => setEditing("new")}>
          + Ajouter un article
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-800">
          {error}
        </p>
      )}
      {!products ? (
        <div className="h-40 animate-pulse bg-sand" />
      ) : products.length === 0 ? (
        <div className="border border-dashed border-line bg-white/50 p-10 text-center">
          <p className="font-display text-2xl">Aucun article pour l&apos;instant</p>
          <p className="mt-1 text-sm text-muted">Ajoutez votre première pièce pour remplir la boutique.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">Aucun article ne correspond à « {search} ».</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => (
            <li
              key={p.id}
              className={`flex flex-wrap items-center gap-4 border border-line bg-white p-3 sm:flex-nowrap ${
                p.is_active ? "" : "opacity-70"
              }`}
            >
              <div className="h-20 w-16 shrink-0 overflow-hidden bg-sand">
                {p.images[0] && (
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-sm text-muted">{p.category ?? "Sans catégorie"}</p>
                </div>
                <p className="mt-0.5 text-sm">{formatPrice(p.price_cents)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      p.stock === 0
                        ? "bg-red-50 text-red-800"
                        : p.stock <= 3
                          ? "bg-amber-50 text-amber-800"
                          : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {p.stock === 0 ? "Épuisé" : `Stock ${p.stock}`}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 ${p.is_active ? "bg-sand" : "bg-ink text-cream"}`}>
                    {p.is_active ? "En ligne" : "Hors ligne"}
                  </span>
                  {p.is_featured && <span className="rounded-full bg-sand px-2 py-0.5">♥ Coup de cœur</span>}
                  {p.is_new && <span className="rounded-full bg-sand px-2 py-0.5">Nouveauté</span>}
                  {(p.colors ?? []).length > 0 && (
                    <span className="rounded-full bg-sand px-2 py-0.5">
                      {p.colors.length} coloris
                    </span>
                  )}
                </div>
              </div>
              {confirmingId === p.id ? (
                <div className="flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm sm:w-auto">
                  <span className="text-red-800">Supprimer définitivement ?</span>
                  <button
                    type="button"
                    className="bg-red-800 px-3 py-1.5 text-white hover:bg-red-900 disabled:opacity-50"
                    disabled={deletingId === p.id}
                    onClick={() => remove(p)}
                  >
                    {deletingId === p.id ? "Suppression…" : "Oui, supprimer"}
                  </button>
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    disabled={deletingId === p.id}
                    onClick={() => setConfirmingId(null)}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex w-full justify-end gap-2 sm:w-auto">
                  <Link
                    href={`/produit/${p.slug}`}
                    target="_blank"
                    className="border border-line px-3 py-1.5 text-sm hover:border-ink"
                    title="Voir sur la boutique"
                  >
                    Voir
                  </Link>
                  <button
                    type="button"
                    className="border border-ink bg-ink px-3 py-1.5 text-sm text-cream hover:bg-[#2a211c]"
                    onClick={() => setEditing(p)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="border border-line px-3 py-1.5 text-sm text-red-800 hover:border-red-800"
                    onClick={() => setConfirmingId(p.id)}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ProductForm({
  supabase,
  product,
  onDone,
  onCancel,
}: {
  supabase: SupabaseClient;
  product: Product | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [colorOptions, setColorOptions] = useState<ColorOptions>(
    product?.color_options ?? {},
  );
  const [customColor, setCustomColor] = useState("");
  const [customHex, setCustomHex] = useState("#c9a227");
  const [uploading, setUploading] = useState(false);

  function toggleColor(name: string) {
    setColors((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  }

  function setColorOption(
    name: string,
    patch: { hex?: string; image?: string | null },
  ) {
    setColorOptions((prev) => {
      const next = { ...(prev[name] ?? {}) };
      if (patch.hex !== undefined) next.hex = patch.hex;
      if (patch.image !== undefined) {
        if (patch.image) next.image = patch.image;
        else delete next.image;
      }
      return { ...prev, [name]: next };
    });
  }

  function addCustomColor() {
    const name = customColor.trim();
    if (!name) return;
    if (!colors.includes(name)) setColors((prev) => [...prev, name]);
    setColorOption(name, { hex: customHex });
    setCustomColor("");
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`« ${file.name} » dépasse 5 Mo.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("products")
        .upload(path, file, { cacheControl: "31536000" });
      if (error) {
        setError(error.message);
        continue;
      }
      urls.push(supabase.storage.from("products").getPublicUrl(path).data.publicUrl);
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const price = Number(String(form.get("price")).replace(",", "."));
    if (!name || !Number.isFinite(price) || price < 0) {
      return setError("Vérifiez le nom et le prix.");
    }
    const values = {
      name,
      description: String(form.get("description")).trim(),
      price_cents: Math.round(price * 100),
      category: String(form.get("category")).trim() || null,
      sizes: String(form.get("sizes"))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors,
      color_options: Object.fromEntries(
        colors.map((c) => {
          const o = colorOptions[c] ?? {};
          return [
            c,
            {
              ...(o.hex && o.hex !== paletteHex(c) ? { hex: o.hex } : {}),
              ...(o.image && images.includes(o.image) ? { image: o.image } : {}),
            },
          ];
        }),
      ),
      stock: Math.max(0, Math.floor(Number(form.get("stock")) || 0)),
      is_featured: form.get("is_featured") === "on",
      is_new: form.get("is_new") === "on",
      is_active: form.get("is_active") === "on",
      images,
    };
    setBusy(true);
    setError(null);
    const { error } = product
      ? await supabase.from("products").update(values).eq("id", product.id)
      : await supabase.from("products").insert({ ...values, slug: slugify(name) });
    setBusy(false);
    if (error) return setError(error.message);
    onDone();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <h2 className="font-display text-2xl">
        {product ? "Modifier l'article" : "Nouvel article"}
      </h2>

      <label className="block text-sm font-normal">
        Nom
        <input name="name" required defaultValue={product?.name} className="field mt-1" />
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block text-sm font-normal">
          Prix (€)
          <input
            name="price"
            required
            inputMode="decimal"
            placeholder="39,90"
            defaultValue={product ? (product.price_cents / 100).toFixed(2) : ""}
            className="field mt-1"
          />
        </label>
        <label className="block text-sm font-normal">
          Stock
          <input
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 1}
            className="field mt-1"
          />
        </label>
        <label className="block text-sm font-normal">
          Catégorie
          <select
            name="category"
            defaultValue={product?.category ?? ""}
            className="field mt-1"
          >
            <option value="">— Aucune —</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug}>{c.label}</option>
            ))}
            {product?.category && !categoryByLabel(product.category) && (
              <option>{product.category}</option>
            )}
          </select>
        </label>
      </div>

      <label className="block text-sm font-normal">
        Tailles (séparées par des virgules)
        <input
          name="sizes"
          placeholder="S, M, L"
          defaultValue={product?.sizes.join(", ") ?? ""}
          className="field mt-1"
        />
      </label>

      <label className="block text-sm font-normal">
        Description
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description}
          className="field mt-1"
        />
      </label>

      <div>
        <p className="text-sm font-normal">Photos (la première sert de vignette)</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((src) => (
            <div key={src} className="relative h-28 w-22 overflow-hidden bg-sand">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Retirer la photo"
                className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white/90 text-sm"
                onClick={() => setImages((prev) => prev.filter((u) => u !== src))}
              >
                ×
              </button>
            </div>
          ))}
          <label className="flex h-28 w-22 cursor-pointer items-center justify-center border border-dashed border-taupe text-center text-xs text-muted">
            {uploading ? "Envoi…" : "+ Ajouter"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              disabled={uploading}
              onChange={(e) => {
                upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="border border-line bg-white/50 p-4">
        <p className="text-sm font-medium">Couleurs disponibles</p>
        <p className="mt-0.5 text-xs text-muted">
          Cliquez sur les couleurs de l&apos;article. Pour chacune, vous pouvez
          ajuster la teinte de la pastille et choisir la photo qui s&apos;affiche
          quand le client la sélectionne.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ...COLORS.map((c) => c.name as string),
            ...colors.filter((c) => !paletteHex(c)),
          ].map((name) => {
            const on = colors.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleColor(name)}
                className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition-colors ${
                  on
                    ? "border-ink bg-ink text-cream"
                    : "border-line bg-white hover:border-taupe"
                }`}
              >
                <span
                  className="h-5 w-5 rounded-full ring-1 ring-ink/15"
                  style={{ backgroundColor: colorHex(name, colorOptions) }}
                />
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex max-w-md flex-wrap items-center gap-2">
          <label
            className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-line"
            title="Choisir la teinte"
            style={{ backgroundColor: customHex }}
          >
            <input
              type="color"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Teinte de la nouvelle couleur"
            />
          </label>
          <input
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomColor();
              }
            }}
            placeholder="Nouvelle couleur (ex. Moutarde)"
            className="field min-w-0 flex-1"
          />
          <button
            type="button"
            className="btn btn-outline shrink-0 px-4"
            onClick={addCustomColor}
          >
            Ajouter
          </button>
        </div>

        {colors.length > 0 && (
          <ul className="mt-5 space-y-3">
            {colors.map((name) => {
              const hex = colorHex(name, colorOptions);
              const image = colorOptions[name]?.image;
              return (
                <li
                  key={name}
                  className="flex flex-wrap items-center gap-3 border-t border-line pt-3"
                >
                  <label
                    className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-ink/15"
                    title="Modifier la teinte"
                    style={{ backgroundColor: hex }}
                  >
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => setColorOption(name, { hex: e.target.value })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label={`Teinte de ${name}`}
                    />
                  </label>
                  <span className="w-32 text-sm font-normal">{name}</span>
                  <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-muted">Photo :</span>
                    {images.length === 0 ? (
                      <span className="text-xs text-muted">
                        ajoutez d&apos;abord des photos
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setColorOption(name, { image: null })}
                          className={`h-12 w-9 border text-[10px] text-muted ${
                            !image ? "border-ink" : "border-line"
                          }`}
                        >
                          aucune
                        </button>
                        {images.map((src) => (
                          <button
                            key={src}
                            type="button"
                            aria-pressed={image === src}
                            onClick={() => setColorOption(name, { image: src })}
                            className={`h-12 w-9 overflow-hidden ring-2 ${
                              image === src
                                ? "ring-ink"
                                : "ring-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Retirer ${name}`}
                    className="text-lg leading-none text-muted hover:text-red-800"
                    onClick={() => toggleColor(name)}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-6 text-sm font-normal">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product?.is_active ?? true}
          />
          En ligne (visible sur la boutique)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
          />
          Coup de cœur (page d&apos;accueil)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_new"
            defaultChecked={product?.is_new ?? true}
          />
          Nouveauté (page Nouveautés et badge « Nouveau »)
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button className="btn" disabled={busy || uploading}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* ------------------------------ Commandes ------------------------------ */

function shippingEmail(order: Order, tracking: string) {
  const first = (order.customer_name ?? "").split(" ")[0];
  const isRelay = order.shipping_method === "relay";
  const lines = [
    `Bonjour${first ? ` ${first}` : ""},`,
    "",
    `Bonne nouvelle : votre commande ${SITE.name} est en route !`,
    "",
    ...order.items.map((it) => `- ${it.quantity} × ${it.name}`),
    "",
    isRelay && order.relay
      ? `Elle sera livrée au point relais : ${order.relay.name}, ${order.relay.address}, ${order.relay.postcode} ${order.relay.city}. Vous recevrez un message de Mondial Relay dès qu'elle sera disponible.`
      : "Elle sera livrée à l'adresse indiquée lors de votre commande.",
    "",
    `Numéro de suivi : ${tracking}`,
    `Suivre le colis : ${trackingUrl(order.shipping_method, tracking)}`,
    "",
    "Merci pour votre confiance et à très bientôt,",
    SITE.name,
  ];
  return `mailto:${encodeURIComponent(order.email ?? "")}?subject=${encodeURIComponent(
    `Votre commande ${SITE.name} est expédiée`,
  )}&body=${encodeURIComponent(lines.join("\n"))}`;
}

function formatAddress(a: Record<string, string | null> | null) {
  if (!a) return "";
  return [a.line1, a.line2, `${a.postal_code ?? ""} ${a.city ?? ""}`, a.country]
    .filter((x) => x && x.trim())
    .join(", ");
}

const EMAIL_LABELS = {
  shipped: "d'expédition",
  delivered: "de livraison",
  refunded: "de remboursement",
} as const;

function sentOn(date: string | undefined) {
  return date
    ? new Date(date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : null;
}

function ReturnDecision({
  request,
  token,
  onChange,
}: {
  request: ReturnRequest;
  token: string;
  onChange: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "acceptée" | "refusée") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/return-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: request.id, decision, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action impossible.");
      if (!data.emailSent) setError(`Décision enregistrée, mais e-mail non envoyé : ${data.emailError}`);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  const tone =
    request.status === "acceptée" ? "bg-emerald-50" : request.status === "refusée" ? "bg-red-50" : "bg-amber-50";
  return (
    <div className={`mt-4 p-4 ${tone}`}>
      <p className="font-medium">
        {request.status === "en attente" ? "↩ Demande de retour à traiter" : `Retour ${request.status}`}
        <span className="ml-2 text-xs font-normal text-muted">
          le {new Date(request.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
        </span>
      </p>
      <p className="mt-1">
        <span className="text-muted">Articles : </span>
        {request.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
      </p>
      <p>
        <span className="text-muted">Motif : </span>
        {request.reason}
      </p>
      {request.message && <p className="mt-1 whitespace-pre-line italic">« {request.message} »</p>}
      {request.admin_note && (
        <p className="mt-2 text-xs">
          <span className="text-muted">Votre réponse : </span>
          {request.admin_note}
        </p>
      )}
      {request.status === "en attente" && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Message à la cliente (obligatoire pour un refus, facultatif pour une acceptation)"
            className="field text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-dark px-4 py-2" disabled={busy} onClick={() => decide("acceptée")}>
              {busy ? "…" : "Accepter le retour"}
            </button>
            <button
              type="button"
              className="btn btn-outline px-4 py-2 text-red-800"
              disabled={busy || !note.trim()}
              onClick={() => decide("refusée")}
            >
              Refuser
            </button>
          </div>
          <p className="text-xs text-muted">
            La cliente est prévenue par e-mail. Si vous acceptez, elle reçoit l&apos;adresse de retour ;
            une fois le colis reçu, remboursez-la dans Stripe puis cliquez sur « Remboursée ».
          </p>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-800">{error}</p>}
    </div>
  );
}

function OrderCard({
  order: o,
  request,
  supabase,
  token,
  onChange,
}: {
  order: Order;
  request?: ReturnRequest;
  supabase: SupabaseClient;
  token: string;
  onChange: () => void;
}) {
  const [tracking, setTracking] = useState(o.tracking_number ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [open, setOpen] = useState(false);
  const sent = o.notifications ?? {};
  // Une fois livrée, on ne revient plus à « expédiée » ; une fois remboursée, tout est figé.
  // (Après livraison, le remboursement reste possible pour un retour sous 14 jours.)
  const refunded = o.status === "remboursée";
  const delivered = o.status === "livrée";
  const inProgress = o.status === "payée" || o.status === "expédiée";
  const lockShipped = !inProgress;
  const lockDelivered = !inProgress;
  const lockRefunded = refunded;
  const count = o.items.reduce((n, it) => n + it.quantity, 0);

  /** Change le statut et envoie l'e-mail correspondant à la cliente. */
  async function notify(kind: "shipped" | "delivered" | "refunded") {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/order-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: o.id, kind, tracking: tracking.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action impossible.");
      setNotice(
        data.emailSent
          ? `E-mail ${EMAIL_LABELS[kind]} envoyé à ${o.email} ✓`
          : `Statut mis à jour, mais e-mail non envoyé : ${data.emailError}`,
      );
      setConfirmRefund(false);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusy(null);
    }
  }
  const a = o.shipping_address;
  const isRelay = o.shipping_method === "relay";

  async function update(values: Partial<Order>) {
    setBusy("status");
    setError(null);
    const { error } = await supabase.from("orders").update(values).eq("id", o.id);
    setBusy(null);
    if (error) return setError(error.message);
    onChange();
  }

  return (
    <li className="border border-line bg-white text-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left hover:bg-cream/60"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {o.customer_name ?? o.email ?? "Cliente"}
          </span>
          <span className="block text-xs text-muted">
            {new Date(o.created_at).toLocaleString("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · {count} article{count > 1 ? "s" : ""} ·{" "}
            {o.shipping_method === "relay" ? "Point relais" : o.shipping_method === "home" ? "Domicile" : "Livraison"}
          </span>
        </span>
        <span className="font-medium">{formatPrice(o.amount_total_cents)}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${
            o.status === "payée" || o.status === "retour demandé"
              ? "bg-amber-50 text-amber-800"
              : o.status === "expédiée" || o.status === "retour accepté"
                ? "bg-sky-50 text-sky-800"
                : o.status === "livrée"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-800"
          }`}
        >
          {o.status === "payée" ? "à expédier" : o.status}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
      <div className="border-t border-line p-4">
      <p className="text-muted">
        {[o.email, o.phone].filter(Boolean).join(" · ")}
      </p>
      <ul className="mt-2">
        {o.items.map((it, i) => (
          <li key={i}>
            {it.quantity} × {it.name}
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-line pt-3">
        <p className="eyebrow mb-1 text-muted">
          {isRelay
            ? "Point relais Mondial Relay"
            : o.shipping_method === "home"
              ? "À domicile (Colissimo)"
              : "Livraison"}
        </p>
        {isRelay && o.relay ? (
          <p>
            <span className="font-medium">{o.relay.name}</span>{" "}
            <span className="text-muted">(n° {o.relay.country}-{o.relay.id})</span>
            <br />
            {o.relay.address}, {o.relay.postcode} {o.relay.city}
          </p>
        ) : a ? (
          <p>{formatAddress(a)}</p>
        ) : (
          <p className="text-muted">Adresse non renseignée</p>
        )}
        {o.billing_address && (
          <p className="mt-2">
            <span className="text-muted">Facturation : </span>
            {formatAddress(o.billing_address) === formatAddress(a)
              ? "identique à la livraison"
              : formatAddress(o.billing_address)}
          </p>
        )}
      </div>

      {request && <ReturnDecision request={request} token={token} onChange={onChange} />}
      {o.status === "annulée" && (
        <p className="mt-4 bg-red-50 p-3 text-sm text-red-900">
          Commande annulée par la cliente
          {o.notifications?.cancelled &&
            ` le ${new Date(o.notifications.cancelled).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}
          . Remboursez-la dans Stripe, puis cliquez sur « Remboursée ».
        </p>
      )}

      {/* Actions : chaque bouton change le statut et prévient la cliente */}
      <div className="mt-4 space-y-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-48 flex-1">
            <span className="text-xs text-muted">Numéro de suivi</span>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Collez le numéro de l'étiquette"
              disabled={lockShipped}
              className="field mt-1 py-2 disabled:bg-sand disabled:text-muted"
            />
          </label>
          <button
            type="button"
            className="btn btn-dark px-4 py-2.5"
            disabled={!!busy || !tracking.trim() || lockShipped}
            onClick={() => notify("shipped")}
          >
            {busy === "shipped"
              ? "Envoi…"
              : lockShipped
                ? "📦 Expédiée"
                : sent.shipped
                  ? "Renvoyer l'e-mail d'expédition"
                  : "📦 Expédiée — prévenir la cliente"}
          </button>
        </div>
        {o.tracking_number && (
          <a
            href={trackingUrl(o.shipping_method, o.tracking_number)}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs underline underline-offset-4"
          >
            Suivre le colis ({o.tracking_number})
          </a>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline px-4 py-2"
            disabled={!!busy || lockDelivered}
            onClick={() => notify("delivered")}
          >
            {busy === "delivered"
              ? "Envoi…"
              : delivered
                ? "✓ Livrée"
                : "✓ Livrée — prévenir la cliente"}
          </button>
          {confirmRefund ? (
            <span className="flex flex-wrap items-center gap-2 bg-red-50 px-3 py-2 text-xs text-red-900">
              Avez-vous bien remboursé dans Stripe ?
              <button
                type="button"
                className="bg-red-800 px-3 py-1 text-white disabled:opacity-50"
                disabled={!!busy}
                onClick={() => notify("refunded")}
              >
                {busy === "refunded" ? "Envoi…" : "Oui, prévenir la cliente"}
              </button>
              <button type="button" className="underline" onClick={() => setConfirmRefund(false)}>
                Annuler
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-outline px-4 py-2 text-red-800"
              disabled={!!busy || lockRefunded}
              onClick={() => setConfirmRefund(true)}
            >
              {refunded ? "↩ Remboursée" : "↩ Remboursée — prévenir la cliente"}
            </button>
          )}
        </div>

        {refunded && (
          <p className="text-xs text-muted">Commande remboursée : plus aucune action possible.</p>
        )}
        {!inProgress && !refunded && (
          <p className="text-xs text-muted">
            {delivered
              ? "Commande livrée. Seul le remboursement reste possible, en cas de retour sous 14 jours."
              : "Seul le remboursement reste possible pour cette commande."}
          </p>
        )}
        {(sent.shipped || sent.delivered || sent.refunded) && (
          <ul className="space-y-0.5 text-xs text-muted">
            {(["shipped", "delivered", "refunded"] as const).map((k) =>
              sent[k] ? (
                <li key={k}>
                  ✉ E-mail {EMAIL_LABELS[k]} envoyé le {sentOn(sent[k])}
                </li>
              ) : null,
            )}
          </ul>
        )}
        {notice && <p className="bg-sand p-2 text-xs">{notice}</p>}
        {!o.email && (
          <p className="text-xs text-muted">Pas d&apos;adresse e-mail pour cette commande.</p>
        )}
        {o.email && o.tracking_number && (
          <a href={shippingEmail(o, o.tracking_number)} className="inline-block text-xs text-muted underline underline-offset-4">
            Ou écrire depuis ma messagerie
          </a>
        )}
      </div>

      <label className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
        Changer le statut sans e-mail
        <select
          value={o.status}
          disabled={!!busy}
          onChange={(e) => update({ status: e.target.value })}
          className="field w-auto py-1"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {error && <p className="mt-2 text-red-800">{error}</p>}
      </div>
      )}
    </li>
  );
}

const ORDER_FILTERS = [
  { id: "toutes", label: "Toutes" },
  { id: "payée", label: "À expédier" },
  { id: "expédiée", label: "Expédiées" },
  { id: "livrée", label: "Livrées" },
  { id: "annulée", label: "Annulées" },
  { id: "retour demandé", label: "Retours à traiter" },
  { id: "retour accepté", label: "Retours acceptés" },
  { id: "remboursée", label: "Remboursées" },
] as const;

function Orders({ supabase, token }: { supabase: SupabaseClient; token: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<(typeof ORDER_FILTERS)[number]["id"]>("toutes");
  const [query, setQuery] = useState("");
  const [returns, setReturns] = useState<Record<string, ReturnRequest>>({});
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setOrders(data as Order[]);
      });
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
    return () => {
      active = false;
    };
  }, [supabase, version]);

  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (!orders) return <p className="text-muted">Chargement…</p>;
  if (orders.length === 0)
    return <p className="text-muted">Aucune commande pour l&apos;instant.</p>;

  const q = query.trim().toLowerCase();
  const matches = (o: Order) =>
    !q ||
    [
      o.customer_name,
      o.email,
      o.phone,
      o.tracking_number,
      o.id,
      o.relay?.name,
      o.relay?.city,
      o.shipping_address?.city,
      o.shipping_address?.postal_code,
      ...o.items.map((it) => it.name),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  const visible = orders.filter(
    (o) => (filter === "toutes" || o.status === filter) && matches(o),
  );

  return (
    <>
      <div className="relative mb-4">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : nom, e-mail, téléphone, n° de suivi, article, ville…"
          aria-label="Rechercher une commande"
          className="field py-2.5 pl-9"
        />
      </div>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {ORDER_FILTERS.map((f) => {
          const count =
            f.id === "toutes" ? orders.length : orders.filter((o) => o.status === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                filter === f.id ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-taupe"
              }`}
            >
              {f.label} <span className={filter === f.id ? "text-cream/70" : "text-muted"}>{count}</span>
            </button>
          );
        })}
      </div>
      {visible.length === 0 && (
        <p className="text-sm text-muted">
          {q ? `Aucune commande ne correspond à « ${query} ».` : "Aucune commande dans cette catégorie."}
        </p>
      )}
    <ul className="space-y-4">
      {visible.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          request={returns[o.id]}
          supabase={supabase}
          token={token}
          onChange={() => setVersion((v) => v + 1)}
        />
      ))}
    </ul>
    </>
  );
}

/* ------------------------------ Newsletter ------------------------------ */

function Newsletter({ supabase }: { supabase: SupabaseClient }) {
  const [rows, setRows] = useState<
    { email: string; created_at: string; welcome_code: string | null }[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("newsletter_subscribers")
      .select("email, created_at, welcome_code")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setRows(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (!rows) return <p className="text-muted">Chargement…</p>;
  if (rows.length === 0)
    return <p className="text-muted">Aucune inscription pour l&apos;instant.</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <p className="text-sm">
          {rows.length} inscrite{rows.length > 1 ? "s" : ""}
        </p>
        <button
          type="button"
          className="btn btn-outline px-4 py-2"
          onClick={async () => {
            await navigator.clipboard.writeText(rows.map((r) => r.email).join(", "));
            setCopied(true);
          }}
        >
          {copied ? "Adresses copiées ✓" : "Copier toutes les adresses"}
        </button>
      </div>
      <ul className="divide-y divide-line border-y border-line text-sm">
        {rows.map((r) => (
          <li key={r.email} className="flex justify-between gap-4 py-2">
            <span className="min-w-0 truncate">{r.email}</span>
            {r.welcome_code && (
              <span className="shrink-0 text-xs tracking-wider text-muted">{r.welcome_code}</span>
            )}
            <span className="shrink-0 text-muted">
              {new Date(r.created_at).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
