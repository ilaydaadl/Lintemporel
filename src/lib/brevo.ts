// À n'importer QUE côté serveur : liste de contacts et e-mails via Brevo.
// Réglages (Vercel > Environment Variables) :
//   BREVO_API_KEY       clé API Brevo (Paramètres > SMTP & API > Clés API)
//   BREVO_LIST_ID       numéro de la liste où ajouter les inscrites (Contacts > Listes)
//   BREVO_SENDER_EMAIL  adresse d'expédition validée dans Brevo (Expéditeurs)
import { OFFER, SITE } from "./config";

const API = "https://api.brevo.com/v3";

function config() {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) {
    console.warn("Brevo non configuré : variable BREVO_API_KEY absente dans Vercel.");
    return null;
  }
  const listId = Number(process.env.BREVO_LIST_ID);
  return {
    key,
    listId: Number.isInteger(listId) && listId > 0 ? listId : null,
    sender: {
      email: process.env.BREVO_SENDER_EMAIL?.trim() || SITE.email,
      name: SITE.name,
    },
  };
}

async function call(path: string, key: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "api-key": key,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Brevo ${path} : ${res.status} ${await res.text()}`);
  }
}

/** Ajoute (ou met à jour) le contact dans la liste Brevo de la newsletter. */
export async function addToBrevoList(email: string) {
  const c = config();
  if (!c || !c.listId) return;
  await call("/contacts", c.key, {
    email,
    listIds: [c.listId],
    updateEnabled: true,
  });
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** E-mail de bienvenue, avec le code personnel s'il y en a un. */
export async function sendWelcomeEmail(
  email: string,
  code: string | null,
  siteUrl: string,
) {
  const c = config();
  if (!c) return;
  const brand = escape(SITE.name);
  const offer = code
    ? `
      <p style="margin:0 0 12px">Pour vous souhaiter la bienvenue, voici votre code personnel
      de <strong>−${OFFER.percent} %</strong> sur votre première commande :</p>
      <p style="margin:0 0 12px">
        <span style="display:inline-block;border:1px dashed #3b302a;background:#f6f1eb;padding:12px 20px;font-size:18px;letter-spacing:3px;font-weight:600">${escape(code)}</span>
      </p>
      <p style="margin:0 0 24px;color:#7d6f65;font-size:14px">Valable une fois, à saisir sur la page de paiement.</p>`
    : "";
  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f6f1eb;font-family:Georgia,serif;color:#3b302a">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <p style="text-align:center;font-size:30px;font-style:italic;margin:0 0 32px">${brand}</p>
    <div style="background:#ffffff;padding:32px 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-style:italic">Bienvenue !</p>
      <p style="margin:0 0 16px">Merci de vous être inscrite. Vous serez la première informée
      de nos nouvelles pièces, choisies en petite quantité.</p>
      ${offer}
      <p style="margin:0">
        <a href="${escape(siteUrl)}/nouveautes" style="display:inline-block;background:#3b302a;color:#f6f1eb;text-decoration:none;padding:12px 24px">Découvrir les nouveautés</a>
      </p>
    </div>
    <p style="text-align:center;color:#7d6f65;font-size:12px;font-family:Helvetica,Arial,sans-serif;margin:24px 0 0">
      ${brand} · <a href="${escape(siteUrl)}" style="color:#7d6f65">${escape(siteUrl.replace(/^https?:\/\//, ""))}</a>
    </p>
  </div>
</body></html>`;

  await call("/smtp/email", c.key, {
    sender: c.sender,
    to: [{ email }],
    subject: code
      ? `Bienvenue chez ${SITE.name} — votre code −${OFFER.percent} %`
      : `Bienvenue chez ${SITE.name}`,
    htmlContent: html,
  });
}
