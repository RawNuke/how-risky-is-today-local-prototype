-- Reclassify rows backfilled by 0002 using the same inspectable concepts as
-- the TypeScript ingestion path. New observations already arrive classified;
-- this migration only repairs legacy/defaulted rows.

with legacy as (
  select
    id,
    category,
    place,
    coalesce(title, '') || ' ' || coalesce(summary, '') as event_text
  from public.signals
  where severity_reason in (
    'Migrated from the earlier three-band event classification.',
    'Classified from the available automated source metadata.'
  )
), features as (
  select
    id,
    category,
    place,
    event_text,
    event_text ~* '\m(hospital|clinic|ivf|school|college|university|mall|market)\M'
      and event_text ~* '\m(negligence|scam|fraud|deception|fir|stillbirth|death|dead|killed|assault|fire|collapse|gone wrong|unsafe)\M' as is_institutional,
    event_text ~* '\m(drown(ing|ed)?|electrocut(ion|ed)?|stampede|building collapse|major fire|fatal|killed|dead|death|body|bodies|blast|explosion|shoot(ing|out)?|stabb(ing|ed)|murder|yamuna|river|flood(ing|ed)?)\M' as is_life_safety,
    event_text ~* '\m(protest|rally|march|demonstration|hunger strike|procession|bandh|crowd|demolition|encroachment drive)\M' as is_crowd_event,
    event_text ~* '\m(ongoing|continuing|continues|underway|active|current|today|now|rising|swollen|warning|alert|closure|closed|diversion|congestion|gridlock|waterlog(ging|ged)?|flood(ing|ed)?|heavy rain|thunderstorm|heatwave|heat wave|dense fog|severe air|hazardous air|toxic smog)\M' as is_live_language
  from legacy
), classified as (
  select
    id,
    place,
    event_text,
    case
      when is_institutional then 'institutional-safety'
      when category = 'weather' and is_life_safety then 'life-safety'
      when category in ('weather', 'air', 'heat') then 'environmental-exposure'
      when is_crowd_event then 'traffic-disruption'
      when category = 'road' and is_life_safety then 'life-safety'
      when category = 'road' then 'traffic-disruption'
      when is_life_safety then 'life-safety'
      else 'public-safety'
    end as risk_type,
    case
      when event_text ~* '\m(mass casualty|multiple deaths|stampede|catastrophic|major explosion)\M'
        then 'severe'
      when event_text ~* '\m(killed|dead|death|fatal|drown(ing|ed)?|building collapse|major fire|blast|explosion|shoot(ing|out)?|stabb(ing|ed))\M'
        then 'high'
      when event_text ~* '\m(assault|clash|fire|collision|accident|protest|rally|hunger strike|waterlog(ging|ged)?|flood(ing|ed)?|red alert|hazardous air|fraud|scam|stillbirth)\M'
        then 'elevated'
      when event_text ~* '\m(closure|closed|diversion|congestion|gridlock|orange alert|dense fog|heavy rain|thunderstorm|heatwave|heat wave|severe air)\M'
        then 'guarded'
      else 'low'
    end as severity,
    case
      when is_institutional then 'static'
      when category in ('weather', 'air', 'heat') or is_live_language then 'live'
      else 'static'
    end as event_behavior
  from features
)
update public.signals as signal
set
  risk_type = classified.risk_type,
  risk_explanation = case
    when classified.risk_type = 'institutional-safety'
      then format('This one-off incident raises a localized safety concern at %s; it does not indicate an ongoing citywide threat.', classified.place)
    when classified.risk_type = 'life-safety'
      and classified.event_text ~* '\m(yamuna|river|flood(ing|ed)?|drown(ing|ed)?)\M'
      then format('Flooding, drowning or unstable water conditions may create life-safety exposure near %s and nearby low-lying areas.', classified.place)
    when classified.risk_type = 'life-safety'
      then format('The reported incident may pose a direct threat to life safety around %s.', classified.place)
    when classified.risk_type = 'traffic-disruption'
      and classified.event_text ~* '\m(protest|rally|march|hunger strike|procession)\M'
      then format('Road closures, diversions, crowds and congestion may affect movement around %s.', classified.place)
    when classified.risk_type = 'traffic-disruption'
      then format('Blocked routes, diversions or slow traffic may affect people travelling around %s.', classified.place)
    when classified.risk_type = 'environmental-exposure'
      then format('Current conditions may increase weather or air-quality exposure around %s.', classified.place)
    else format('The reported incident may create a localized public-safety concern around %s.', classified.place)
  end,
  severity = classified.severity,
  severity_reason = case classified.severity
    when 'severe' then 'The report indicates multiple casualties or a potentially catastrophic event.'
    when 'high' then 'The report indicates a fatality or an immediate threat to life safety.'
    when 'elevated' then 'The reported conditions could materially affect safety or local movement.'
    when 'guarded' then 'The report warrants caution, but does not indicate a major immediate impact.'
    else 'The report describes a localized risk with limited indicated impact.'
  end,
  event_behavior = classified.event_behavior,
  expires_at = case
    when classified.event_behavior = 'live'
      then coalesce(signal.last_observed_at, signal.updated_at, now()) + interval '6 hours'
    else coalesce(signal.occurred_at, signal.created_at, now()) + interval '7 days'
  end
from classified
where signal.id = classified.id;
