import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";
const LOG_PREFIX = "[MisGastos:Reminders]";

type ReminderSlot = "morning" | "afternoon";

type DueItemRow = {
  id: string;
  user_id: string;
  amount_ars: number | string;
};

type UserReminder = {
  itemIds: string[];
  count: number;
  totalAmountArs: number;
  userId: string;
};

type SendResult = {
  message: string;
  notificationId: string | null;
  sent: boolean;
  userId: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getArgentinaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function formatCurrencyArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildReminderMessage(slot: ReminderSlot, count: number, totalAmountArs: number) {
  const amount = formatCurrencyArs(totalAmountArs);
  const paymentsLabel = count === 1 ? "1 pago pendiente" : `${count} pagos pendientes`;

  if (slot === "morning") {
    return `Hoy tenés ${paymentsLabel} por ${amount}.`;
  }

  return `Todavía tenés ${paymentsLabel} por ${amount}.`;
}

function groupDueItemsByUser(items: DueItemRow[]) {
  const grouped = new Map<string, UserReminder>();

  for (const item of items) {
    const current = grouped.get(item.user_id) ?? {
      userId: item.user_id,
      itemIds: [],
      count: 0,
      totalAmountArs: 0,
    };

    current.itemIds.push(item.id);
    current.count += 1;
    current.totalAmountArs += Number(item.amount_ars);
    grouped.set(item.user_id, current);
  }

  return grouped;
}

function parseSlot(value: unknown): ReminderSlot | null {
  if (value === "morning" || value === "afternoon") {
    return value;
  }

  return null;
}

async function sendOneSignalNotification(
  userId: string,
  message: string,
  appId: string,
  restApiKey: string,
) {
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${restApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: {
        external_id: [userId],
      },
      target_channel: "push",
      headings: {
        es: "Mis Gastos",
        en: "Mis Gastos",
      },
      contents: {
        es: message,
        en: message,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload && "errors" in payload
        ? JSON.stringify(payload.errors)
        : `OneSignal respondió ${response.status}`,
    );
  }

  const notificationId =
    typeof payload === "object" && payload && "id" in payload && typeof payload.id === "string"
      ? payload.id
      : null;

  return notificationId;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = request.headers.get("x-cron-secret");

  if (!cronSecret || providedSecret !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
  const oneSignalRestApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !oneSignalAppId || !oneSignalRestApiKey) {
    return jsonResponse({ error: "Missing required environment variables" }, 500);
  }

  let body: { slot?: unknown } = {};

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const slot = parseSlot(body.slot);

  if (!slot) {
    return jsonResponse({ error: 'Body must include slot: "morning" or "afternoon"' }, 400);
  }

  const { year, month, day } = getArgentinaDateParts();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id, user_id, amount_ars")
    .eq("type", "PAY")
    .eq("completed", false)
    .eq("year", year)
    .eq("month", month)
    .eq("due_day", day)
    .not("due_day", "is", null);

  if (itemsError) {
    console.error(LOG_PREFIX, "Error al consultar items", itemsError);
    return jsonResponse({ error: itemsError.message }, 500);
  }

  const grouped = groupDueItemsByUser(items ?? []);
  const results: SendResult[] = [];

  for (const reminder of grouped.values()) {
    if (reminder.count === 0) {
      continue;
    }

    const message = buildReminderMessage(slot, reminder.count, reminder.totalAmountArs);

    try {
      const notificationId = await sendOneSignalNotification(
        reminder.userId,
        message,
        oneSignalAppId,
        oneSignalRestApiKey,
      );

      const { error: logError } = await supabase.from("notification_logs").insert({
        user_id: reminder.userId,
        slot,
        item_count: reminder.count,
        total_amount_ars: reminder.totalAmountArs,
        message,
        item_ids: reminder.itemIds,
        onesignal_notification_id: notificationId,
      });

      if (logError) {
        console.error(LOG_PREFIX, "Error al guardar log", logError);
      }

      results.push({
        userId: reminder.userId,
        sent: true,
        message,
        notificationId,
      });
    } catch (error) {
      console.error(LOG_PREFIX, "Error al enviar push", reminder.userId, error);
      results.push({
        userId: reminder.userId,
        sent: false,
        message,
        notificationId: null,
      });
    }
  }

  const responseBody = {
    slot,
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    dueDay: day,
    usersNotified: results.filter((result) => result.sent).length,
    usersFailed: results.filter((result) => !result.sent).length,
    usersSkipped: 0,
    results,
  };

  console.info(LOG_PREFIX, "Ejecución completada", responseBody);

  return jsonResponse(responseBody);
});
