-- ============================================================
-- Maryland Estates: per-user schema
-- Run this in the Supabase SQL editor.
-- ============================================================

-- ── 1. profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  records_count     integer not null default 0,
  last_ingested_at  timestamptz null,
  created_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── 2. Auto-create profile on signup ────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 3. estate_records ────────────────────────────────────────
create table if not exists public.estate_records (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  estate_number           text not null,
  county                  text,
  type                    text,
  status                  text,
  date_opened             text,
  date_closed             text,
  reference               text,
  decedent_name           text,
  personal_representative text,
  pr_address              text,
  attorney                text,
  detail_url              text,
  scraped_at              text,
  upserted_at             timestamptz not null default now(),

  constraint estate_records_user_estate_unique unique (user_id, estate_number)
);

create index if not exists estate_records_user_idx
  on public.estate_records (user_id);

create index if not exists estate_records_user_scraped_idx
  on public.estate_records (user_id, scraped_at desc);

alter table public.estate_records enable row level security;

create policy "Users can read own records"
  on public.estate_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own records"
  on public.estate_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own records"
  on public.estate_records for update
  using (auth.uid() = user_id);

create policy "Users can delete own records"
  on public.estate_records for delete
  using (auth.uid() = user_id);
