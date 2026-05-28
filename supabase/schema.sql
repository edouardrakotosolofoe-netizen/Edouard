-- INSCRIPTION LPCSP - Schema Supabase complet
-- 1) Ouvrir Supabase Dashboard > SQL Editor
-- 2) Coller tout ce fichier puis Run
-- 3) Créer un bucket Storage public nommé: documents

create extension if not exists pgcrypto;

create table if not exists inscriptions (
  id uuid primary key default gen_random_uuid(),
  type_inscription text default 'nouvelle',
  annee_scolaire text,
  nom text not null,
  prenoms text not null,
  date_naissance date,
  lieu_naissance text,
  sexe text,
  nationalite text,
  adresse text,
  telephone text,
  email text,
  classe_demandee text,
  ancienne_classe text,
  regime text,
  responsable_nom text,
  responsable_tel text,
  profession text,
  observation text,
  fichier_url text,
  fichier_nom text,
  statut text default 'En attente',
  created_at timestamptz default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  ordre int default 0,
  created_at timestamptz default now()
);

create table if not exists dossiers (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  ordre int default 0,
  created_at timestamptz default now()
);

create table if not exists annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists contacts (
  id int primary key default 1,
  telephone text,
  email text,
  adresse text,
  facebook text,
  updated_at timestamptz default now()
);

create table if not exists settings (
  id int primary key default 1,
  annee_scolaire text default '2025-2026',
  inscription_ouverte boolean default true,
  message_accueil text default 'Bienvenue sur la plateforme officielle d’inscription du Lycée Catholique Saint Paul Morondava.',
  updated_at timestamptz default now()
);

create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  url text not null,
  created_at timestamptz default now()
);

insert into classes(nom,ordre) values
('6ème',1),('5ème',2),('4ème',3),('3ème',4),('2nde',5),('1ère',6),('Terminale',7)
on conflict (nom) do nothing;

insert into dossiers(titre,ordre) values
('Bulletin dernier trimestre',1),('Acte de naissance',2),('Photo d’identité',3),('Certificat de résidence',4),('Fiche de renseignement',5),('Quitus ou reçu de paiement pour la réinscription',6)
on conflict do nothing;

insert into annonces(titre,contenu,active) values
('Début des inscriptions','Les inscriptions et réinscriptions sont ouvertes.',true)
on conflict do nothing;

insert into contacts(id,telephone,email,adresse,facebook) values
(1,'+261 00 000 00','lyceesaintpaul@example.com','Morondava - Madagascar','Lycée Catholique Saint Paul Morondava')
on conflict (id) do nothing;

insert into settings(id,annee_scolaire,inscription_ouverte,message_accueil) values
(1,'2025-2026',true,'Bienvenue sur la plateforme officielle d’inscription du Lycée Catholique Saint Paul Morondava.')
on conflict (id) do nothing;

alter table inscriptions enable row level security;
alter table classes enable row level security;
alter table dossiers enable row level security;
alter table annonces enable row level security;
alter table contacts enable row level security;
alter table settings enable row level security;
alter table media_items enable row level security;

drop policy if exists "public all inscriptions" on inscriptions;
create policy "public all inscriptions" on inscriptions for all using (true) with check (true);
drop policy if exists "public all classes" on classes;
create policy "public all classes" on classes for all using (true) with check (true);
drop policy if exists "public all dossiers" on dossiers;
create policy "public all dossiers" on dossiers for all using (true) with check (true);
drop policy if exists "public all annonces" on annonces;
create policy "public all annonces" on annonces for all using (true) with check (true);
drop policy if exists "public all contacts" on contacts;
create policy "public all contacts" on contacts for all using (true) with check (true);
drop policy if exists "public all settings" on settings;
create policy "public all settings" on settings for all using (true) with check (true);
drop policy if exists "public all media" on media_items;
create policy "public all media" on media_items for all using (true) with check (true);
