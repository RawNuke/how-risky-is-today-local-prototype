-- Run ingestion independently of Netlify. The invocation keys live in Vault;
-- this migration contains only their stable names, never their values.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $validate_vault$
begin
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'risk_atlas_environment_edge_key'
      and decrypted_secret is not null
  ) then
    raise exception 'Missing Vault secret risk_atlas_environment_edge_key';
  end if;

  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'risk_atlas_risk_edge_key'
      and decrypted_secret is not null
  ) then
    raise exception 'Missing Vault secret risk_atlas_risk_edge_key';
  end if;
end
$validate_vault$;

do $remove_old_jobs$
declare
  existing_job bigint;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname in (
      'risk-atlas-refresh-environment',
      'risk-atlas-refresh-risk'
    )
  loop
    perform cron.unschedule(existing_job);
  end loop;
end
$remove_old_jobs$;

select cron.schedule(
  'risk-atlas-refresh-environment',
  '*/5 * * * *',
  $environment_job$
    select net.http_post(
      url := 'https://rdozlnyhkylsintakxgw.supabase.co/functions/v1/refresh-environment',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'risk_atlas_environment_edge_key'
          limit 1
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) as request_id;
  $environment_job$
);

-- Offset the deeper job from the five-minute cadence so both writers do not
-- start together. It still runs once every two hours.
select cron.schedule(
  'risk-atlas-refresh-risk',
  '17 */2 * * *',
  $risk_job$
    select net.http_post(
      url := 'https://rdozlnyhkylsintakxgw.supabase.co/functions/v1/refresh-risk',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'risk_atlas_risk_edge_key'
          limit 1
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    ) as request_id;
  $risk_job$
);
