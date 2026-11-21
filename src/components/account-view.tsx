"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, trackingUrl } from "@/lib/config";
import { useSession } from "@/lib/session";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Order, Product } from "@/lib/types";
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
  return session ? <Dashboard email={session.user.email ?? ""} /> : <AuthForms />;
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
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        {info && <p className="bg-sand p-3 text-sm">{info}</p>}
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

function Dashboard({ email }: { email: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [favorites, setFavorites] = useState<Product[] | null>(null);

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
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow text-muted">Mon compte</p>
          <h1 className="font-display mt-2 text-5xl">Bonjour</h1>
          <p className="mt-1 text-sm text-muted">{email}</p>
        </div>
        <button
          type="button"
          className="text-sm underline underline-offset-4"
          onClick={() => getBrowserSupabase()?.auth.signOut()}
        >
          Se déconnecter
        </button>
      </div>

      <div className="mt-10 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-3xl">Mes commandes</h2>
          {orders === null ? (
            <p className="mt-4 text-muted">Chargement…</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 text-muted">
              Aucune commande pour l&apos;instant. Les commandes passées en étant
              connectée apparaîtront ici.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {orders.map((o) => (
                <li key={o.id} className="border border-line bg-white/60 p-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">
                      {new Date(o.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                    <p className="font-medium">{formatPrice(o.amount_total_cents)}</p>
                  </div>
                  <ul className="mt-2 text-muted">
                    {o.items.map((it, i) => (
                      <li key={i}>
                        {it.quantity} × {it.name}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="bg-sand px-2.5 py-1 text-xs capitalize">{o.status}</span>
                    {o.tracking_number && (
                      <a
                        href={trackingUrl(o.shipping_method, o.tracking_number)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline underline-offset-4"
                      >
                        Suivre le colis ({o.tracking_number})
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-display text-3xl">Mes favoris</h2>
          {favorites === null ? (
            <p className="mt-4 text-muted">Chargement…</p>
          ) : favorites.length === 0 ? (
            <p className="mt-4 text-muted">
              Aucun favori pour l&apos;instant. Cliquez sur le cœur d&apos;un article pour
              le retrouver ici.{" "}
              <Link href="/boutique" className="text-ink underline underline-offset-4">
                Voir la boutique
              </Link>
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
              {favorites.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
