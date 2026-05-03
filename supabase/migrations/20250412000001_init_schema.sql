-- ============================================================
-- QuoteFlow — Initial Schema
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
-- Extends auth.users. Created automatically on first sign-in
-- via the trigger below.
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text not null default '',
  primary_photo_url text,
  photos           text[] not null default '{}',
  is_premium       boolean not null default false,
  premium_expiry   timestamptz,
  created_at       timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── cards ────────────────────────────────────────────────────
-- Pre-designed greeting images with overlay slot metadata.
-- Publicly readable — no auth required.
create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  category    text not null,
  is_premium  boolean not null default false,
  created_at  timestamptz not null default now(),
  photo_slot  jsonb not null,
  name_slot   jsonb not null
);

-- Helpful index for category filtering
create index cards_category_idx on public.cards (category);

-- ── Row-Level Security ───────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.cards enable row level security;

-- profiles: owner can read and update their own row
create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- cards: anyone can read (including anonymous / unauthenticated)
create policy "cards: public read"
  on public.cards for select
  using (true);

-- ── Storage bucket ───────────────────────────────────────────
-- Bucket for user bg-removed photos. Insert via service below;
-- public read so images can be loaded by URL in the app.
insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', true)
on conflict (id) do nothing;

-- Authenticated users can upload to their own folder
create policy "user-photos: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read (images embedded in public card previews)
create policy "user-photos: public read"
  on storage.objects for select
  using (bucket_id = 'user-photos');

-- Owner can delete their own photos
create policy "user-photos: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
