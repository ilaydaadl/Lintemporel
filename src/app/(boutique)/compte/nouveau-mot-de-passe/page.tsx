"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { getBrowserSupabase } from "@/lib/supabase-browser";

// Page ouverte depuis le lien « mot de passe oublié » reçu par e-mail.
export default function NouveauMotDePassePage() {
  const { session, ready } = useSession();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (password.length < 8) return setError("Au moins 8 caractères, s'il vous plaît.");
    setBusy(true);
    const { error } = await getBrowserSupabase()!.auth.updateUser({ password });
    setBusy(false);
    if (error) setError("Le changement n'a pas fonctionné. Redemandez un lien.");
    else setDone(true);
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:px-8">
      <h1 className="font-display text-center text-5xl">Nouveau mot de passe</h1>
      {!ready ? null : done ? (
        <p className="mt-8 text-center">
          C&apos;est fait !{" "}
          <Link href="/compte" className="underline underline-offset-4">
            Accéder à mon compte
          </Link>
        </p>
      ) : !session ? (
        <p className="mt-8 text-center text-muted">
          Ce lien n&apos;est plus valable.{" "}
          <Link href="/compte" className="text-ink underline underline-offset-4">
            Redemander un lien
          </Link>
        </p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm">
            Choisissez un nouveau mot de passe
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field mt-1 py-3" />
          </label>
          {error && <p className="text-sm text-red-800">{error}</p>}
          <button className="btn btn-dark w-full py-3.5" disabled={busy}>
            {busy ? "…" : "Enregistrer"}
          </button>
        </form>
      )}
    </section>
  );
}
