-- Bookmark metadata on profiles only; remove lead rows from cloud.
-- Run after 001_init.sql in Supabase SQL Editor.

alter table public.profiles
  add column if not exists last_result_page integer null,
  add column if not exists last_scrape_started_at timestamptz null,
  add column if not exists last_scrape_finished_at timestamptz null,
  add column if not exists scrape_cursor jsonb null;

-- Lead data should live on the scraper PC as CSV, not in Postgres.
drop table if exists public.estate_records cascade;
