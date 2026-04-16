-- Bookmark schema v2: clearer scrape state + full bookmark reset.
-- Run after 003_add_last_estate_number.sql in Supabase SQL Editor.

-- Bookmark schema v2: clearer scrape state + full bookmark reset.

alter table public.profiles
  add column if not exists last_scrape_status text not null default 'idle',
  add column if not exists last_scrape_error text null,
  add column if not exists last_bookmark_reset_at timestamptz null,
  add column if not exists bookmark_schema_version integer not null default 2;

-- Reset bookmark data for all users so everyone starts clean on schema v2.
update public.profiles
set
  records_count = 0,
  last_ingested_at = null,
  last_result_page = null,
  last_estate_number = null,
  last_scrape_started_at = null,
  last_scrape_finished_at = null,
  scrape_cursor = null,
  last_scrape_status = 'idle',
  last_scrape_error = null,
  bookmark_schema_version = 2,
  last_bookmark_reset_at = now();