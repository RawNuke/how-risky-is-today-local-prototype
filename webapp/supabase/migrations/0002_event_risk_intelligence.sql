-- Event-level risk intelligence and bounded public visibility.
-- This migration is intentionally additive/idempotent because 0001 is already
-- deployed in production.

alter table public.signals
  add column if not exists risk_type text,
  add column if not exists risk_explanation text,
  add column if not exists severity_reason text,
  add column if not exists event_behavior text,
  add column if not exists last_observed_at timestamptz,
  add column if not exists expires_at timestamptz;

-- Translate legacy rows before replacing the three-band severity constraint.
alter table public.signals drop constraint if exists signals_severity_check;
update public.signals set severity = 'guarded' where severity = 'normal';

update public.signals
set
  risk_type = coalesce(risk_type, case category
    when 'road' then 'traffic-disruption'
    when 'weather' then 'environmental-exposure'
    when 'air' then 'environmental-exposure'
    when 'heat' then 'environmental-exposure'
    else 'public-safety'
  end),
  risk_explanation = coalesce(nullif(risk_explanation, ''), nullif(summary, ''),
    'Open the publisher report for details about this localized risk.'),
  severity_reason = coalesce(nullif(severity_reason, ''),
    'Migrated from the earlier three-band event classification.'),
  event_behavior = coalesce(event_behavior, case
    when category in ('weather', 'air', 'heat') then 'live'
    else 'static'
  end),
  last_observed_at = coalesce(last_observed_at, updated_at, created_at),
  expires_at = coalesce(expires_at, case
    when category in ('weather', 'air', 'heat')
      then coalesce(updated_at, created_at) + interval '6 hours'
    else coalesce(occurred_at, created_at) + interval '7 days'
  end);

-- Keep the currently deployed refresh functions compatible during the short
-- migration-to-code-deploy window. Older functions do not send the new risk
-- fields and may still emit the legacy `normal` severity. This trigger fills
-- the new contract on both inserts and upserts until every caller is updated.
create or replace function public.normalize_signal_risk_intelligence()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.severity = 'normal' then
    new.severity := 'guarded';
  end if;

  new.risk_type := coalesce(new.risk_type, case new.category
    when 'road' then 'traffic-disruption'
    when 'weather' then 'environmental-exposure'
    when 'air' then 'environmental-exposure'
    when 'heat' then 'environmental-exposure'
    else 'public-safety'
  end);
  new.risk_explanation := coalesce(
    nullif(new.risk_explanation, ''),
    nullif(new.summary, ''),
    'Open the publisher report for details about this localized risk.'
  );
  new.severity_reason := coalesce(
    nullif(new.severity_reason, ''),
    'Classified from the available automated source metadata.'
  );
  new.event_behavior := coalesce(new.event_behavior, case
    when new.category in ('weather', 'air', 'heat') then 'live'
    else 'static'
  end);
  new.last_observed_at := coalesce(new.last_observed_at, new.updated_at, new.created_at, now());
  new.expires_at := coalesce(new.expires_at, case
    when new.event_behavior = 'live'
      then new.last_observed_at + interval '6 hours'
    else coalesce(new.occurred_at, new.created_at, now()) + interval '7 days'
  end);
  return new;
end;
$$;

drop trigger if exists normalize_signal_risk_intelligence on public.signals;
create trigger normalize_signal_risk_intelligence
before insert or update on public.signals
for each row execute function public.normalize_signal_risk_intelligence();

alter table public.signals
  alter column risk_type set not null,
  alter column risk_explanation set not null,
  alter column severity_reason set not null,
  alter column event_behavior set not null,
  alter column last_observed_at set not null,
  alter column expires_at set not null,
  alter column severity set default 'guarded';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.signals'::regclass
      and conname = 'signals_risk_type_check'
  ) then
    alter table public.signals add constraint signals_risk_type_check
      check (risk_type in ('life-safety','traffic-disruption','environmental-exposure','public-safety','institutional-safety'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.signals'::regclass
      and conname = 'signals_severity_check'
  ) then
    alter table public.signals add constraint signals_severity_check
      check (severity in ('low','guarded','elevated','high','severe'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.signals'::regclass
      and conname = 'signals_event_behavior_check'
  ) then
    alter table public.signals add constraint signals_event_behavior_check
      check (event_behavior in ('live','static'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.signals'::regclass
      and conname = 'signals_expiry_after_observation_check'
  ) then
    alter table public.signals add constraint signals_expiry_after_observation_check
      check (expires_at > last_observed_at or event_behavior = 'static');
  end if;
end
$$;

create index if not exists signals_public_current_idx
on public.signals (expires_at desc, occurred_at desc)
where status in ('pending', 'verified');

drop policy if exists "public reads verified signals" on public.signals;
drop policy if exists "public reads current signals" on public.signals;
create policy "public reads current signals" on public.signals
for select using (
  status in ('pending', 'verified')
  and expires_at > now()
  and longitude is not null
  and latitude is not null
);

drop view if exists public.public_verified_signals;
create view public.public_verified_signals
with (security_invoker = true)
as
select
  id,
  title,
  summary,
  category,
  risk_type,
  risk_explanation,
  place,
  longitude,
  latitude,
  severity,
  severity_reason,
  event_behavior,
  source_url,
  occurred_at,
  reviewed_at,
  last_observed_at,
  expires_at
from public.signals
where status in ('pending', 'verified')
  and expires_at > now()
  and longitude is not null
  and latitude is not null;

grant select on public.public_verified_signals to anon, authenticated;

comment on column public.signals.expires_at is
  'Public visibility cutoff. Live observations are extended when re-seen; static incidents are capped at seven days.';
comment on view public.public_verified_signals is
  'Legacy view name retained for API compatibility; returns current automated and verified located signals only.';
