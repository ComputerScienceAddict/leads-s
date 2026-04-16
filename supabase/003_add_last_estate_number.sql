-- Add last_estate_number to profiles for safer scrape bookmarking.
-- This is written after every saved record so crashes are recoverable.

alter table public.profiles
  add column if not exists last_estate_number text null;
