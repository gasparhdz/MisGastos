-- Configuración de cron para recordatorios push (09:00 y 16:00, hora Argentina).
--
-- Ejecutar UNA VEZ en Supabase Dashboard → SQL Editor, después de:
-- 1. Deploy de la Edge Function send-due-reminders
-- 2. Configurar secrets en Dashboard → Edge Functions → Secrets:
--    - ONESIGNAL_APP_ID
--    - ONESIGNAL_REST_API_KEY
--    - CRON_SECRET (generá un valor aleatorio largo)
-- 3. Reemplazar TU_CRON_SECRET de abajo

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Guardá secretos en Vault (reemplazá TU_CRON_SECRET)
select vault.create_secret('https://auwyruvwonvbtkgwngul.supabase.co', 'misgastos_project_url');
select vault.create_secret('TU_CRON_SECRET', 'misgastos_cron_secret');

-- Mañana: 09:00 America/Argentina/Buenos_Aires
do $$
begin
  if exists (select 1 from cron.job where jobname = 'misgastos-send-due-reminders-morning') then
    perform cron.unschedule('misgastos-send-due-reminders-morning');
  end if;
end $$;

select cron.schedule(
  'misgastos-send-due-reminders-morning',
  '0 9 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'misgastos_project_url')
      || '/functions/v1/send-due-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'misgastos_cron_secret')
    ),
    body := '{"slot":"morning"}'::jsonb
  ) as request_id;
  $$,
  'America/Argentina/Buenos_Aires'
);

-- Tarde: 16:00 America/Argentina/Buenos_Aires
do $$
begin
  if exists (select 1 from cron.job where jobname = 'misgastos-send-due-reminders-afternoon') then
    perform cron.unschedule('misgastos-send-due-reminders-afternoon');
  end if;
end $$;

select cron.schedule(
  'misgastos-send-due-reminders-afternoon',
  '0 16 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'misgastos_project_url')
      || '/functions/v1/send-due-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'misgastos_cron_secret')
    ),
    body := '{"slot":"afternoon"}'::jsonb
  ) as request_id;
  $$,
  'America/Argentina/Buenos_Aires'
);
