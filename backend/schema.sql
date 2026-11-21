-- Birthday Moments: surprise storage.
-- Run once in the Supabase SQL editor (Project → SQL Editor → New query). Safe to run again.

create table if not exists public.surprises (
  id         text primary key check (id ~ '^[a-z0-9]{10}$'),
  data       jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now()
);

-- Only the backend (connecting as the database owner) may read or write surprises.
-- Row Level Security with no policies blocks the public Supabase REST API (anon / authenticated keys).
alter table public.surprises enable row level security;
revoke all on table public.surprises from anon, authenticated;
