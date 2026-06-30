-- Configuración de cron para recordatorios push (09:00 y 16:00, hora Argentina).
--
-- ANTES de ejecutar este script:
-- 1. Supabase Dashboard → Database → Extensions
-- 2. Habilitar pg_cron
-- 3. Habilitar pg_net
-- 4. Deploy de send-due-reminders + secrets en Edge Functions
-- 5. Reemplazar TU_CRON_SECRET abajo (mismo valor que CRON_SECRET)
--
-- Supabase pg_cron usa UTC. Argentina (ART) = UTC-3:
--   09:00 ART → 12:00 UTC  → 0 12 * * *
--   16:00 ART → 19:00 UTC  → 0 19 * * *
--
-- Si vault.create_secret falla por duplicado, comentá las líneas 18-19.

select vault.create_secret('https://auwyruvwonvbtkgwngul.supabase.co', 'misgastos_project_url');
select vault.create_secret('TU_CRON_SECRET', 'misgastos_cron_secret');

-- Mañana: 09:00 ART (12:00 UTC)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'misgastos-send-due-reminders-morning') then
    perform cron.unschedule('misgastos-send-due-reminders-morning');
  end if;
end $$;

select cron.schedule(
  'misgastos-send-due-reminders-morning',
  '0 12 * * *',
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
  $$
);

-- Tarde: 16:00 ART (19:00 UTC)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'misgastos-send-due-reminders-afternoon') then
    perform cron.unschedule('misgastos-send-due-reminders-afternoon');
  end if;
end $$;

select cron.schedule(
  'misgastos-send-due-reminders-afternoon',
  '0 19 * * *',
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
  $$
);
