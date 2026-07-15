create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table if not exists public.official_baselines (
  id uuid primary key default gen_random_uuid(),
  geography text not null,
  metric text not null,
  annual_rate_per_100k numeric not null check (annual_rate_per_100k >= 0),
  micromorts_per_average_day numeric generated always as (annual_rate_per_100k / 100000.0 * 1000000.0 / 365.0) stored,
  numerator numeric,
  denominator numeric,
  source_year integer not null,
  source_table text not null,
  source_url text not null unique,
  grain text not null,
  status text not null default 'reconciliation-pending' check (status in ('reconciliation-pending','verified','retired')),
  created_at timestamptz not null default now(),
  unique (geography, metric, source_year)
);

create table if not exists public.source_articles (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  title text not null,
  domain text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  source_article_id uuid references public.source_articles(id) on delete set null,
  title text not null,
  summary text not null default '',
  category text not null default 'civic' check (category in ('weather','air','heat','road','civic')),
  place text not null,
  longitude double precision,
  latitude double precision,
  severity text not null default 'elevated' check (severity in ('normal','elevated','severe')),
  status text not null default 'pending' check (status in ('pending','verified','rejected','duplicate')),
  source_url text not null,
  occurred_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.authorities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  authority_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.signal_authorities (
  signal_id uuid not null references public.signals(id) on delete cascade,
  authority_id uuid not null references public.authorities(id) on delete cascade,
  role text not null,
  attribution_status text not null check (attribution_status in ('reported','alleged','officially-confirmed','disputed','unknown')),
  evidence_url text not null,
  evidence_basis text not null,
  reviewer_confidence numeric check (reviewer_confidence between 0 and 1),
  reviewed_at timestamptz,
  primary key (signal_id, authority_id, role)
);

create table if not exists public.risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  next_review_at timestamptz not null,
  scene text not null check (scene in ('rain','heat','haze','road','quiet')),
  weather jsonb not null default '{}'::jsonb,
  air jsonb not null default '{}'::jsonb,
  verified_signal_count integer not null default 0,
  run_id text not null unique,
  processing_status text not null default 'complete' check (processing_status in ('complete','partial','failed'))
);

create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  previous_status text,
  next_status text not null,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
alter table public.official_baselines enable row level security;
alter table public.source_articles enable row level security;
alter table public.signals enable row level security;
alter table public.authorities enable row level security;
alter table public.signal_authorities enable row level security;
alter table public.risk_snapshots enable row level security;
alter table public.review_events enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create policy "public reads verified baselines" on public.official_baselines
for select using (status = 'verified');

create policy "public reads verified signals" on public.signals
for select using (status = 'verified');

create policy "public reads verified signal authorities" on public.signal_authorities
for select using (
  exists (select 1 from public.signals s where s.id = signal_id and s.status = 'verified')
);

create policy "public reads authorities" on public.authorities
for select using (true);

create policy "public reads complete snapshots" on public.risk_snapshots
for select using (processing_status = 'complete');

create policy "admins read all signals" on public.signals
for select to authenticated using (public.is_app_admin());
create policy "admins update signals" on public.signals
for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy "admins read sources" on public.source_articles
for select to authenticated using (public.is_app_admin());
create policy "admins read events" on public.review_events
for select to authenticated using (public.is_app_admin());

create or replace function public.audit_signal_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.review_events (signal_id, actor_id, previous_status, next_status)
    values (new.id, auth.uid(), old.status, new.status);
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists audit_signal_status on public.signals;
create trigger audit_signal_status
before update on public.signals
for each row execute function public.audit_signal_status_change();

create or replace view public.public_verified_signals
with (security_invoker = true)
as
select id, title, summary, category, place, longitude, latitude, severity, source_url, occurred_at, reviewed_at
from public.signals
where status = 'verified';

create unique index if not exists signals_source_url_unique
on public.signals (source_url);
