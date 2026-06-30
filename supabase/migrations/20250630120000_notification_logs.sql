-- Historial de recordatorios push enviados (solo acceso server-side).

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slot text not null check (slot in ('morning', 'afternoon')),
  sent_at timestamptz not null default now(),
  item_count integer not null check (item_count > 0),
  total_amount_ars numeric(14, 2) not null,
  message text not null,
  item_ids uuid[] not null default '{}',
  onesignal_notification_id text
);

create index if not exists notification_logs_user_sent_at_idx
  on public.notification_logs (user_id, sent_at desc);

create index if not exists notification_logs_slot_sent_at_idx
  on public.notification_logs (slot, sent_at desc);

alter table public.notification_logs enable row level security;

-- Sin policies: los clientes no leen ni escriben. La Edge Function usa service_role.
