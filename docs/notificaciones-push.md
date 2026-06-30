# Recordatorios push de vencimientos

Envío automático de notificaciones a las **09:00** y **16:00** (hora Argentina) para pagos pendientes que vencen **hoy**.

## Comportamiento

| Horario | Condición | Mensaje |
|---------|-----------|---------|
| 09:00 | Hay pagos pendientes con vencimiento hoy | `Hoy tenés N pagos pendientes por $X.` |
| 16:00 | Todavía quedan pendientes hoy | `Todavía tenés N pagos pendientes por $X.` |
| Cualquiera | No hay pendientes hoy | **No se envía nada** |

Solo entran ítems con:

- `type = PAY`
- `completed = false`
- `due_day = hoy` (Argentina)
- `year` / `month` del mes actual

Los pagos ya marcados como hechos no se mencionan. Si a las 16:00 no queda ninguno pendiente, no llega segunda notificación.

## Arquitectura

```
pg_cron (09:00 / 16:00 ART)
  → Edge Function send-due-reminders
    → Query items en Postgres (service role)
    → OneSignal REST API (external_id = user_id Supabase)
    → notification_logs
```

## Deploy

### 1. Migración

En **Supabase Dashboard → SQL Editor**, ejecutá el contenido de:

`supabase/migrations/20250630120000_notification_logs.sql`

### 2. Secrets de la Edge Function

En **Dashboard → Edge Functions → Secrets**, agregá:

| Secret | Valor |
|--------|-------|
| `ONESIGNAL_APP_ID` | Mismo App ID del frontend |
| `ONESIGNAL_REST_API_KEY` | OneSignal → Settings → Keys & IDs → REST API Key |
| `CRON_SECRET` | String aleatorio largo (ej. `openssl rand -hex 32`) |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente.

### 3. Deploy de la función

Con [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref auwyruvwonvbtkgwngul
supabase functions deploy send-due-reminders --no-verify-jwt
supabase secrets set ONESIGNAL_APP_ID=... ONESIGNAL_REST_API_KEY=... CRON_SECRET=...
```

Sin CLI: subí `supabase/functions/send-due-reminders/index.ts` desde el Dashboard → Edge Functions → Create function.

### 4. Cron

1. **Database → Extensions** → habilitar `pg_cron` y `pg_net`
2. Editá `supabase/setup/schedule-reminders-cron.sql` reemplazando `TU_CRON_SECRET` y ejecutalo en **SQL Editor**.

**Nota:** Supabase `pg_cron` corre en **UTC**. Los horarios del script equivalen a:
- `0 12 * * *` → 09:00 Argentina
- `0 19 * * *` → 16:00 Argentina

Verificá jobs:

```sql
select jobid, jobname, schedule, active from cron.job
where jobname like 'misgastos-send-due-reminders%';
```

### 5. Prueba manual

Agregá a `.env.local` (no commitear):

```
CRON_SECRET=el_mismo_valor_que_en_supabase
```

Luego:

```bash
node scripts/send-due-reminders-test.mjs morning
node scripts/send-due-reminders-test.mjs afternoon
```

Necesitás al menos un pago pendiente con `due_day = hoy` y notificaciones activadas en el dispositivo.

## Requisitos del usuario

1. Haber tocado **Activar notificaciones** en la app (OneSignal `external_id` = UUID de Supabase).
2. Tener pagos pendientes que venzan hoy en el mes actual.

## Logs

Consulta en Supabase:

```sql
select *
from notification_logs
order by sent_at desc
limit 20;
```
