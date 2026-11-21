"use client";

import { useState } from "react";
import { OFFER } from "@/lib/config";

type Result = { code: string | null; already?: boolean; alreadyCustomer?: boolean };

/** Inscription « Soyez la première informée » : affiche le code de bienvenue personnel. */
export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      setMessage("Vérifiez votre adresse e-mail.");
      return;
    }
    setState("busy");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: form.get("website") ?? "" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "L'inscription n'a pas fonctionné.");
      setResult(data);
      setState("done");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "L'inscription n'a pas fonctionné.");
    }
  }

  if (state === "done" && result) {
    if (result.code) {
      return (
        <div>
          <p className="font-normal">
            {result.already ? "Vous êtes déjà inscrite. " : "Merci, vous êtes inscrite ! "}
            Voici votre code personnel −{OFFER.percent} % :
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="border border-dashed border-ink bg-cream px-4 py-2 font-medium tracking-[0.15em]">
              {result.code}
            </span>
            <button
              type="button"
              className="text-sm underline underline-offset-4"
              onClick={async () => {
                await navigator.clipboard.writeText(result.code!);
                setCopied(true);
              }}
            >
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Valable une fois, sur votre première commande : saisissez-le sur la
            page de paiement. Pensez à le noter.
          </p>
        </div>
      );
    }
    return (
      <p className="py-3 font-normal">
        {result.alreadyCustomer
          ? "Merci, vous êtes inscrite ! (Le code de bienvenue est réservé à la première commande.)"
          : result.already
            ? "Vous êtes déjà inscrite, merci !"
            : "Merci ! Vous serez la première informée des nouveautés."}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="text-sm text-muted">
        Adresse e-mail
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@exemple.fr"
          className="field min-w-0 flex-1"
        />
        {/* Piège à robots : invisible pour les personnes */}
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <button className="btn btn-dark shrink-0 px-5" disabled={state === "busy"}>
          {state === "busy" ? "…" : "S'inscrire"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Recevez votre code −{OFFER.percent} % pour votre première commande.
      </p>
      {state === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {message}
        </p>
      )}
    </form>
  );
}
