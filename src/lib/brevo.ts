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

/* ------------------------------------------------------------ E-mails de commande */

export type OrderEmailKind = "shipped" | "delivered" | "refunded";

type OrderForEmail = {
  email: string;
  customer_name: string | null;
  amount_total_cents: number;
  items: { name: string; quantity: number }[];
  shipping_method: string | null;
  relay: { name: string; address: string; postcode: string; city: string } | null;
  tracking_number: string | null;
};

function emailLayout(title: string, body: string, siteUrl: string) {
  const brand = escape(SITE.name);
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f6f1eb;font-family:Georgia,serif;color:#3b302a">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <p style="text-align:center;font-size:30px;font-style:italic;margin:0 0 32px">${brand}</p>
    <div style="background:#ffffff;padding:32px 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-style:italic">${title}</p>
      ${body}
    </div>
    <p style="text-align:center;color:#7d6f65;font-size:12px;font-family:Helvetica,Arial,sans-serif;margin:24px 0 0">
      Une question ? Répondez simplement à cet e-mail ou écrivez à ${escape(SITE.email)}.<br/>
      ${brand} · <a href="${escape(siteUrl)}" style="color:#7d6f65">${escape(siteUrl.replace(/^https?:\/\//, ""))}</a>
    </p>
  </div>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0 0"><a href="${escape(href)}" style="display:inline-block;background:#3b302a;color:#f6f1eb;text-decoration:none;padding:12px 24px">${escape(label)}</a></p>`;

function itemsList(order: OrderForEmail) {
  return `<ul style="margin:0 0 16px;padding-left:18px;color:#7d6f65">${order.items
    .map((it) => `<li>${it.quantity} × ${escape(it.name)}</li>`)
    .join("")}</ul>`;
}

/** E-mail à la cliente : commande expédiée, livrée ou remboursée. */
export async function sendOrderEmail(
  order: OrderForEmail,
  kind: OrderEmailKind,
  siteUrl: string,
  tracking: { url: string } | null,
) {
  const c = config();
  if (!c) throw new Error("Brevo n'est pas configuré (BREVO_API_KEY manquante dans Vercel).");
  const first = (order.customer_name ?? "").trim().split(/\s+/)[0];
  const hello = `<p style="margin:0 0 16px">Bonjour${first ? ` ${escape(first)}` : ""},</p>`;
  const price = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    order.amount_total_cents / 100,
  );

  let subject: string;
  let title: string;
  let body: string;

  if (kind === "shipped") {
    const where =
      order.shipping_method === "relay" && order.relay
        ? `au point relais <strong>${escape(order.relay.name)}</strong>, ${escape(order.relay.address)}, ${escape(order.relay.postcode)} ${escape(order.relay.city)}. Mondial Relay vous préviendra dès qu'il sera disponible.`
        : "à l'adresse indiquée lors de votre commande.";
    subject = `Votre commande ${SITE.name} est en route`;
    title = "Votre colis est en route !";
    body = `${hello}
      <p style="margin:0 0 16px">Bonne nouvelle : votre commande vient d'être expédiée.</p>
      ${itemsList(order)}
      <p style="margin:0 0 16px">Elle sera livrée ${where}</p>
      ${order.tracking_number ? `<p style="margin:0">Numéro de suivi : <strong>${escape(order.tracking_number)}</strong></p>` : ""}
      ${tracking ? button(tracking.url, "Suivre mon colis") : ""}`;
  } else if (kind === "delivered") {
    subject = `Votre commande ${SITE.name} est arrivée`;
    title = "Votre commande est arrivée";
    body = `${hello}
      <p style="margin:0 0 16px">Votre commande a bien été livrée. Nous espérons qu'elle vous plaît !</p>
      ${itemsList(order)}
      <p style="margin:0 0 16px">Montrez-nous vos looks sur Instagram en nous identifiant
      <strong>@${escape(SITE.instagram)}</strong> 🤍</p>
      <p style="margin:0;color:#7d6f65;font-size:14px">Une pièce ne vous convient pas ? Vous avez 14 jours
      après réception pour changer d'avis : il suffit de répondre à cet e-mail.</p>
      ${button(`${siteUrl}/nouveautes`, "Voir les nouveautés")}`;
  } else {
    subject = `Votre remboursement ${SITE.name}`;
    title = "Votre remboursement est en cours";
    body = `${hello}
      <p style="margin:0 0 16px">Nous avons procédé au remboursement de votre commande
      d'un montant de <strong>${price}</strong>.</p>
      ${itemsList(order)}
      <p style="margin:0">Le montant apparaîtra sur votre compte d'ici 5 à 10 jours ouvrés,
      selon votre banque, sur le moyen de paiement utilisé lors de la commande.</p>`;
  }

  await call("/smtp/email", c.key, {
    sender: c.sender,
    replyTo: { email: SITE.email, name: SITE.name },
    to: [{ email: order.email, ...(order.customer_name ? { name: order.customer_name } : {}) }],
    subject,
    htmlContent: emailLayout(title, body, siteUrl),
  });
}

/* ------------------------------------------------------------ Annulations et retours */

type SimpleOrder = {
  id: string;
  email: string | null;
  customer_name: string | null;
  amount_total_cents: number;
};

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const helloFor = (name: string | null) => {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return `<p style="margin:0 0 16px">Bonjour${first ? ` ${escape(first)}` : ""},</p>`;
};

/** Envoie un e-mail mis en forme aux couleurs de la boutique. */
async function sendStyled(to: string, subject: string, title: string, body: string, siteUrl: string) {
  const c = config();
  if (!c) throw new Error("Brevo n'est pas configuré (BREVO_API_KEY manquante dans Vercel).");
  await call("/smtp/email", c.key, {
    sender: c.sender,
    replyTo: { email: SITE.email, name: SITE.name },
    to: [{ email: to }],
    subject,
    htmlContent: emailLayout(title, body, siteUrl),
  });
}

/** Alerte envoyée à la boutique (annulation, demande de retour). */
export async function sendShopAlert(subject: string, lines: string[], siteUrl: string) {
  const body = `${lines.map((l) => `<p style="margin:0 0 10px">${l}</p>`).join("")}
    ${button(`${siteUrl}/admin`, "Ouvrir l'administration")}`;
  await sendStyled(SITE.email, subject, subject, body, siteUrl);
}

/** Cliente : confirmation d'annulation de sa commande. */
export async function sendCancelledEmail(order: SimpleOrder, siteUrl: string) {
  if (!order.email) return;
  await sendStyled(
    order.email,
    `Annulation de votre commande ${SITE.name}`,
    "Votre commande est annulée",
    `${helloFor(order.customer_name)}
     <p style="margin:0 0 16px">Nous avons bien pris en compte l'annulation de votre commande
     d'un montant de <strong>${euros(order.amount_total_cents)}</strong>.</p>
     <p style="margin:0">Vous serez remboursée sur votre moyen de paiement d'origine ; vous
     recevrez un e-mail de confirmation dès que le remboursement sera effectué.</p>`,
    siteUrl,
  );
}

/** Cliente : accusé de réception de sa demande de retour. */
export async function sendReturnReceivedEmail(order: SimpleOrder, siteUrl: string) {
  if (!order.email) return;
  await sendStyled(
    order.email,
    `Votre demande de retour ${SITE.name}`,
    "Demande de retour reçue",
    `${helloFor(order.customer_name)}
     <p style="margin:0">Nous avons bien reçu votre demande de retour. Nous l'étudions et
     revenons vers vous très vite avec la marche à suivre.</p>`,
    siteUrl,
  );
}

/** Cliente : décision sur sa demande de retour. */
export async function sendReturnDecisionEmail(
  order: SimpleOrder,
  accepted: boolean,
  note: string | null,
  returnAddress: string,
  siteUrl: string,
) {
  if (!order.email) return;
  const noteHtml = note
    ? `<p style="margin:0 0 16px;padding:12px 16px;background:#f6f1eb">${escape(note).replace(/\n/g, "<br/>")}</p>`
    : "";
  const body = accepted
    ? `${helloFor(order.customer_name)}
       <p style="margin:0 0 16px">Bonne nouvelle : votre demande de retour est <strong>acceptée</strong>.</p>
       ${noteHtml}
       <p style="margin:0 0 8px">Merci de nous renvoyer le ou les articles, non portés et dans leur
       état d'origine, sous 14 jours, à l'adresse suivante :</p>
       <p style="margin:0 0 16px"><strong>${escape(SITE.name)}</strong><br/>${escape(returnAddress)}</p>
       <p style="margin:0;color:#7d6f65;font-size:14px">Les frais de retour sont à votre charge. Pensez à
       conserver la preuve de dépôt. Le remboursement est effectué dès réception du colis.</p>`
    : `${helloFor(order.customer_name)}
       <p style="margin:0 0 16px">Nous avons étudié votre demande de retour et ne pouvons
       malheureusement pas l'accepter.</p>
       ${noteHtml}
       <p style="margin:0">Pour toute question, répondez simplement à cet e-mail.</p>`;
  await sendStyled(
    order.email,
    accepted ? `Votre retour ${SITE.name} est accepté` : `Votre demande de retour ${SITE.name}`,
    accepted ? "Retour accepté" : "Votre demande de retour",
    body,
    siteUrl,
  );
}
