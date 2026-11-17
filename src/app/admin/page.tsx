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
  paletteHex,
  SITE,
  trackingUrl,
} from "@/lib/config";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { ColorOptions, Order, Product } from "@/lib/types";

export default function AdminPage() {
  const supabase = getBrowserSupabase();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [adminCheck, setAdminCheck] = useState<{
    userId: string;
    ok: boolean;
  } | null>(null);

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <h1 className="font-display text-3xl">{SITE.name} — Administration</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4">
            Voir la boutique
          </Link>
          {session && supabase && (
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => supabase.auth.signOut()}
            >
              Se déconnecter
            </button>
          )}
        </div>
      </div>

      {!supabase ? (
        <p>
          Supabase n&apos;est pas encore connecté. Renseignez les variables
          d&apos;environnement (voir le fichier README) puis relancez le site.
        </p>
      ) : session === undefined ? (
        <p className="text-muted">Chargement…</p>
      ) : !session ? (
        <Login supabase={supabase} />
      ) : isAdmin === null ? (
        <p className="text-muted">Vérification des droits…</p>
      ) : !isAdmin ? (
        <p>
          Le compte {session.user.email} n&apos;a pas les droits
          d&apos;administration.
        </p>
      ) : (
        <Dashboard supabase={supabase} token={session.access_token} />
      )}
    </div>
  );
}

function Login({ supabase }: { supabase: SupabaseClient }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) setError("E-mail ou mot de passe incorrect.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4">
      <label className="block text-sm font-normal">
        E-mail
        <input name="email" type="email" required autoComplete="email" className="field mt-1" />
      </label>
      <label className="block text-sm font-normal">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field mt-1"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <button className="btn w-full" disabled={busy}>
        {busy ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

function Dashboard({
  supabase,
  token,
}: {
  supabase: SupabaseClient;
  token: string;
}) {
  const [tab, setTab] = useState<"articles" | "commandes">("articles");
  return (
    <>
      <div className="mb-6 flex gap-6 text-sm font-normal">
        {(["articles", "commandes"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b pb-1 capitalize ${
              tab === t ? "border-ink" : "border-transparent text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "articles" ? (
        <Products supabase={supabase} token={token} />
      ) : (
        <Orders supabase={supabase} />
      )}
    </>
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

  return (
    <>
      <button type="button" className="btn mb-6" onClick={() => setEditing("new")}>
        + Ajouter un article
      </button>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-800">
          {error}
        </p>
      )}
      {!products ? (
        <p className="text-muted">Chargement…</p>
      ) : products.length === 0 ? (
        <p className="text-muted">Aucun article pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 py-3">
              <div className="h-16 w-13 shrink-0 overflow-hidden bg-sand">
                {p.images[0] && (
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-normal">{p.name}</p>
                <p className="text-sm text-muted">
                  {formatPrice(p.price_cents)} · stock {p.stock}
                  {!p.is_active && " · hors ligne"}
                  {p.is_featured && " · coup de cœur"}
                  {p.is_new && " · nouveauté"}
                </p>
              </div>
              {confirmingId === p.id ? (
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
                  <span className="text-red-800">Supprimer définitivement ?</span>
                  <button
                    type="button"
                    className="bg-red-800 px-3 py-1 text-white hover:bg-red-900 disabled:opacity-50"
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
                <>
                  <button
                    type="button"
                    className="text-sm underline underline-offset-4"
                    onClick={() => setEditing(p)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="text-sm text-red-800 underline underline-offset-4"
                    onClick={() => setConfirmingId(p.id)}
                  >
                    Supprimer
                  </button>
                </>
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

function OrderCard({
  order: o,
  supabase,
  onChange,
}: {
  order: Order;
  supabase: SupabaseClient;
  onChange: () => void;
}) {
  const [tracking, setTracking] = useState(o.tracking_number ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = o.shipping_address;
  const isRelay = o.shipping_method === "relay";

  async function update(values: Partial<Order>) {
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("orders").update(values).eq("id", o.id);
    setBusy(false);
    if (error) return setError(error.message);
    onChange();
  }

  return (
    <li className="border border-line bg-white p-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="font-medium">
          {o.customer_name ?? "Client"} · {formatPrice(o.amount_total_cents)}
        </p>
        <p className="text-muted">
          {new Date(o.created_at).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
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

      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
        <label className="flex-1">
          <span className="text-xs text-muted">Numéro de suivi</span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Collez le numéro de l'étiquette"
            className="field mt-1 py-1.5"
          />
        </label>
        <button
          type="button"
          className="btn px-4 py-2"
          disabled={busy || !tracking.trim()}
          onClick={() =>
            update({
              tracking_number: tracking.trim(),
              status: "expédiée",
              shipped_at: o.shipped_at ?? new Date().toISOString(),
            })
          }
        >
          {o.tracking_number ? "Mettre à jour" : "Marquer expédiée"}
        </button>
      </div>

      {o.tracking_number && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {o.email ? (
            <a
              href={shippingEmail(o, o.tracking_number)}
              className="btn btn-outline px-4 py-2"
            >
              Prévenir la cliente par e-mail
            </a>
          ) : (
            <span className="text-muted">Pas d&apos;e-mail pour cette commande</span>
          )}
          <a
            href={trackingUrl(o.shipping_method, o.tracking_number)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            Suivre le colis
          </a>
          {o.shipped_at && (
            <span className="text-xs text-muted">
              Expédiée le{" "}
              {new Date(o.shipped_at).toLocaleDateString("fr-FR", {
                dateStyle: "medium",
              })}
            </span>
          )}
        </div>
      )}

      <label className="mt-3 flex items-center gap-2">
        Statut
        <select
          value={o.status}
          disabled={busy}
          onChange={(e) => update({ status: e.target.value })}
          className="field w-auto py-1"
        >
          {["payée", "expédiée", "livrée", "remboursée"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {error && <p className="mt-2 text-red-800">{error}</p>}
    </li>
  );
}

function Orders({ supabase }: { supabase: SupabaseClient }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
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
    return () => {
      active = false;
    };
  }, [supabase, version]);

  if (error) return <p className="text-sm text-red-800">{error}</p>;
  if (!orders) return <p className="text-muted">Chargement…</p>;
  if (orders.length === 0)
    return <p className="text-muted">Aucune commande pour l&apos;instant.</p>;

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          supabase={supabase}
          onChange={() => setVersion((v) => v + 1)}
        />
      ))}
    </ul>
  );
}
