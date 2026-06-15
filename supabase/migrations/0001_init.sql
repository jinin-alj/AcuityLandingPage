-- waitlist
create table if not exists public.waitlist_signups (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text not null unique,
  referral_code     text not null unique,
  referred_by       text,
  tier              text,
  ab_variant        text,
  verified          boolean not null default false,
  verify_token      text not null,
  confirmation_sent boolean not null default false,
  seq_stage         smallint not null default 0,
  created_at        timestamptz not null default now(),
  verified_at       timestamptz
);

create index if not exists waitlist_referred_by_idx on public.waitlist_signups (referred_by);
create index if not exists waitlist_seq_idx on public.waitlist_signups (verified, seq_stage);
create or replace view public.referral_counts with (security_invoker = true) as
  select referred_by as referral_code, count(*)::int as referrals
  from public.waitlist_signups
  where referred_by is not null
  group by referred_by;

-- analystics
create table if not exists public.analytics_events (
  id            bigint generated always as identity primary key,
  event         text not null,
  props         jsonb default '{}'::jsonb,
  session_id    text,
  ab_variant    text,
  referrer_code text,
  path          text,
  created_at    timestamptz not null default now()
);

create index if not exists analytics_event_idx on public.analytics_events (event, created_at);

-- rls
alter table public.waitlist_signups enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "anon can insert analytics" on public.analytics_events;
create policy "anon can insert analytics"
  on public.analytics_events
  for insert
  to anon
  with check (true);
