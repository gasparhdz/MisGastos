import type { Item, ItemInput } from "@/features/items/types";
import { calculateAmountArs } from "@/features/items/utils";
import { supabase } from "@/lib/supabase";

type ItemRow = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  type: "PAY" | "COLLECT";
  concept: string;
  currency: "ARS" | "USD";
  original_amount: number | string;
  usd_rate: number | string | null;
  amount_ars: number | string;
  due_day: number | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type ItemPayload = {
  year: number;
  month: number;
  type: "PAY" | "COLLECT";
  concept: string;
  currency: "ARS" | "USD";
  original_amount: number;
  usd_rate: number | null;
  amount_ars: number;
  due_day: number | null;
  completed: boolean;
};

export async function listItems(userId: string, year: number, month: number) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .order("due_day", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapItemRow);
}

export async function createItem(userId: string, input: ItemInput) {
  const payload = mapItemInput(input);
  const { data, error } = await supabase
    .from("items")
    .insert({
      ...payload,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapItemRow(data as ItemRow);
}

export async function updateItem(id: string, input: ItemInput) {
  const { data, error } = await supabase
    .from("items")
    .update(mapItemInput(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapItemRow(data as ItemRow);
}

export async function copyPreviousMonthItems(
  userId: string,
  sourceYear: number,
  sourceMonth: number,
  targetYear: number,
  targetMonth: number,
) {
  const sourceItems = await listItems(userId, sourceYear, sourceMonth);

  if (sourceItems.length === 0) {
    return [];
  }

  const payloads = sourceItems.map((item) => ({
    user_id: userId,
    year: targetYear,
    month: targetMonth,
    type: item.type,
    concept: item.concept,
    currency: item.currency,
    original_amount: 0,
    usd_rate: null,
    amount_ars: 0,
    due_day: null,
    completed: false,
  }));

  const { data, error } = await supabase
    .from("items")
    .insert(payloads)
    .select("*");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapItemRow(row as ItemRow));
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function toggleItemCompleted(id: string, completed: boolean) {
  const { data, error } = await supabase
    .from("items")
    .update({ completed })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapItemRow(data as ItemRow);
}

function mapItemInput(input: ItemInput): ItemPayload {
  const normalizedInput = {
    ...input,
    concept: input.concept.trim(),
    usdRate: input.currency === "USD" && input.originalAmount > 0 ? input.usdRate : undefined,
  };

  return {
    year: normalizedInput.year,
    month: normalizedInput.month,
    type: normalizedInput.type,
    concept: normalizedInput.concept,
    currency: normalizedInput.currency,
    original_amount: normalizedInput.originalAmount,
    usd_rate: normalizedInput.currency === "USD" ? normalizedInput.usdRate ?? null : null,
    amount_ars: calculateAmountArs(normalizedInput),
    due_day: normalizedInput.dueDay ?? null,
    completed: normalizedInput.completed,
  };
}

function mapItemRow(row: ItemRow): Item {
  return {
    id: row.id,
    userId: row.user_id,
    year: row.year,
    month: row.month,
    type: row.type,
    concept: row.concept,
    currency: row.currency,
    originalAmount: Number(row.original_amount),
    usdRate: row.usd_rate === null ? undefined : Number(row.usd_rate),
    amountArs: Number(row.amount_ars),
    dueDay: row.due_day ?? undefined,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}




