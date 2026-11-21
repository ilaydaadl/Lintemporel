"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/** Inscription « Soyez la première informée » (enregistrée dans Supabase). */
export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      setMessage("Vérifiez votre adresse e-mail.");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setState("error");
      setMessage("Inscription indisponible pour le moment.");
      return;
    }
    setState("busy");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    // 23505 = déjà inscrite : on la remercie quand même
    if (error && error.code !== "23505") {
      setState("error");
      setMessage("L'inscription n'a pas fonctionné, réessayez.");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <p className="py-3 font-normal">
        Merci ! Vous serez la première informée des nouveautés.
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
        <button className="btn btn-dark shrink-0 px-5" disabled={state === "busy"}>
          {state === "busy" ? "…" : "S'inscrire"}
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {message}
        </p>
      )}
    </form>
  );
}
