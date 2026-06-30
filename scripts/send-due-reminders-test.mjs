#!/usr/bin/env node

/**
 * Invoca manualmente la Edge Function send-due-reminders.
 *
 * Uso:
 *   node scripts/send-due-reminders-test.mjs morning
 *   node scripts/send-due-reminders-test.mjs afternoon
 *
 * Variables (.env.local o entorno):
 *   SUPABASE_URL=https://xxx.supabase.co
 *   CRON_SECRET=...
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local opcional si las vars ya están en el entorno
  }
}

function getSlotArg() {
  const slot = process.argv[2];

  if (slot !== "morning" && slot !== "afternoon") {
    console.error("Uso: node scripts/send-due-reminders-test.mjs <morning|afternoon>");
    process.exit(1);
  }

  return slot;
}

loadEnvLocal();

const slot = getSlotArg();
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const cronSecret = process.env.CRON_SECRET;

if (!supabaseUrl || !cronSecret) {
  console.error("Faltan SUPABASE_URL (o VITE_SUPABASE_URL) y CRON_SECRET.");
  process.exit(1);
}

const response = await fetch(`${supabaseUrl}/functions/v1/send-due-reminders`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-cron-secret": cronSecret,
  },
  body: JSON.stringify({ slot }),
});

const payload = await response.json().catch(() => ({}));

console.log("Status:", response.status);
console.log(JSON.stringify(payload, null, 2));

if (!response.ok) {
  process.exit(1);
}
