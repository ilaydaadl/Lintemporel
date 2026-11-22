-- L'Intemporel — schéma de la base Supabase.
-- À exécuter une seule fois dans Supabase > SQL Editor.

-- ---------------------------------------------------------------- Tables

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  images      text[] not null default '{}',
  sizes       text[] not null default '{}',
  colors      text[] not null default '{}',
  color_options jsonb not null default '{}',
  category    text,
  stock       integer not null default 0 check (stock >= 0),
  variant_stock jsonb not null default '{}',  -- stock par « Couleur|Taille »
  is_featured boolean not null default false,
  is_new      boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text not null unique,
  email              text,
  customer_name      text,
  amount_total_cents integer not null default 0,
  shipping_address   jsonb,
  billing_address    jsonb,
  items              jsonb not null default '[]',
  status             text not null default 'payée',
  shipping_method    text,          -- 'relay' (point relais) ou 'home' (domicile)
  relay              jsonb,         -- point relais choisi
  phone              text,
  tracking_number    text,
  shipped_at         timestamptz,
  created_at         timestamptz not null default now()
);

-- Liste des comptes autorisés à gérer la boutique.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- ---------------------------------------------------------------- Droits

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

alter table public.products enable row level security;
alter table public.orders   enable row level security;
alter table public.admins   enable row level security;

-- Catalogue : tout le monde lit les articles en ligne ; seuls les admins écrivent.
create policy "Lecture publique des articles en ligne"
  on public.products for select
  using (is_active or (select private.is_admin()));

create policy "Ajout par les admins"
  on public.products for insert to authenticated
  with check ((select private.is_admin()));

create policy "Modification par les admins"
  on public.products for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Suppression par les admins"
  on public.products for delete to authenticated
  using ((select private.is_admin()));

-- Commandes : créées uniquement par le serveur (clé secrète), lues par les admins.
create policy "Lecture des commandes par les admins"
  on public.orders for select to authenticated
  using ((select private.is_admin()));

create policy "Suivi des commandes par les admins"
  on public.orders for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Chacun peut seulement vérifier s'il est lui-même admin.
create policy "Voir sa propre ligne admin"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- Stock

-- Appelée par le serveur après un paiement réussi.
create function public.decrement_stock(p_product_id uuid, p_quantity integer)
returns void
language sql
set search_path = ''
as $$
  update public.products
  set stock = greatest(stock - p_quantity, 0)
  where id = p_product_id;
$$;

revoke execute on function public.decrement_stock(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.decrement_stock(uuid, integer) to service_role;

-- ---------------------------------------------------------------- Photos

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products', 'products', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Envoi de photos par les admins"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (select private.is_admin()));

create policy "Suppression de photos par les admins"
  on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (select private.is_admin()));

-- ---------------------------------------------------------------- Admins
-- Après avoir créé un compte dans Authentication > Users, donnez-lui les droits :
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'votre-adresse@exemple.fr';
