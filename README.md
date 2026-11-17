# L'Intemporel — boutique en ligne

Next.js (React) hébergé sur **Vercel**, catalogue et commandes dans **Supabase**,
paiement par carte avec **Stripe Checkout**. Tout fonctionne avec les offres gratuites ;
Stripe ne prélève qu'une commission sur chaque vente (pas d'abonnement).

## Lancer le site sur votre ordinateur

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:3000. Tant que Supabase n'est pas connecté, le site
affiche des articles d'exemple.

## Mise en service

### 1. Supabase (base de données, photos, comptes admin)

1. Créez un projet sur https://supabase.com (région Europe).
2. **SQL Editor** : collez le contenu de `supabase/schema.sql` et exécutez-le.
3. **Authentication > Users > Add user** : créez le compte de chaque admin
   (e-mail + mot de passe).
4. **SQL Editor** : donnez-lui les droits d'administration :
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'votre-adresse@exemple.fr';
   ```
5. **Authentication > Sign In / Providers** : désactivez « Allow new users to sign up »
   (personne d'autre ne doit pouvoir créer de compte).
6. **Project Settings > API Keys** : notez l'URL du projet, la clé *publishable*
   et la clé *secret*.

### 2. Stripe (paiements)

1. Créez un compte sur https://stripe.com. Restez en **mode test** pour les essais.
2. **Développeurs > Clés API** : notez la clé secrète (`sk_test_...`).
3. Une fois le site déployé (étape 3), **Développeurs > Webhooks > Ajouter un endpoint** :
   - URL : `https://VOTRE-SITE.vercel.app/api/stripe/webhook`
   - Évènements : `checkout.session.completed` et
     `checkout.session.async_payment_succeeded`
   - Notez la clé de signature (`whsec_...`).
4. Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque.
5. Pour encaisser réellement : activez votre compte Stripe, puis remplacez les clés
   test par les clés live (et recréez le webhook en mode live).

### 3. GitHub + Vercel (hébergement)

1. Poussez ce dossier sur un dépôt GitHub.
2. Sur https://vercel.com : **Add New > Project**, importez le dépôt.
3. Dans **Environment Variables**, ajoutez les 5 variables listées dans `.env.example`.
4. Déployez. Chaque `git push` redéploie ensuite le site automatiquement.

En local, copiez `.env.example` en `.env.local` et remplissez-le.

## Utilisation au quotidien

- **Espace admin** : `/admin` — ajouter, modifier, mettre hors ligne ou supprimer des
  articles, envoyer les photos, suivre les commandes et leur statut.
- **Coups de cœur** : cochez « Coup de cœur » sur un article pour l'afficher à l'accueil.
- **Réglages** (`src/lib/config.ts`) : compte Instagram, e-mail de contact, frais de
  port, seuil de livraison offerte, pays livrés, photo de la bannière.

## Comment le paiement est sécurisé

- Le client paie sur la page hébergée par Stripe : aucune donnée bancaire ne passe
  par le site ni par la base.
- Le navigateur n'envoie que des identifiants d'articles et des quantités ; les prix
  et le stock sont relus dans la base côté serveur (`src/app/api/checkout`).
- La commande n'est enregistrée qu'à réception de la confirmation signée de Stripe
  (`src/app/api/stripe/webhook`), puis le stock est décrémenté.
- Les règles RLS de Supabase n'autorisent l'écriture du catalogue qu'aux comptes
  listés dans la table `admins`.
