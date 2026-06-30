import type { Item, PaymentGroup, PaymentGroupStatus } from "@/features/items/types";

export type GroupPaymentsOptions = {
  currentDay?: number;
  monthLabel: string;
};

export function calculateAmountArs(item: Pick<Item, "currency" | "originalAmount" | "usdRate">) {
  if (item.currency === "USD") {
    return item.originalAmount * (item.usdRate ?? 0);
  }

  return item.originalAmount;
}

export function groupPaymentsByDueDay(
  items: Item[],
  { currentDay, monthLabel }: GroupPaymentsOptions,
): PaymentGroup[] {
  const payments = items
    .filter((item) => item.type === "PAY")
    .sort(sortByDueDay);
  const groups = new Map<number | "none", Item[]>();

  for (const item of payments) {
    const key = item.dueDay ?? "none";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.entries()).map(([day, groupItems]) => ({
    key: day,
    label: day === "none" ? "Sin vencimiento" : `${String(day).padStart(2, "0")} ${monthLabel}`,
    items: groupItems,
    status: getGroupStatus(day, groupItems, currentDay),
  }));
}

export function sortByDueDay(a: Item, b: Item) {
  const dayA = a.dueDay ?? 99;
  const dayB = b.dueDay ?? 99;

  if (dayA !== dayB) {
    return dayA - dayB;
  }

  if (a.completed !== b.completed) {
    return Number(a.completed) - Number(b.completed);
  }

  return a.concept.localeCompare(b.concept);
}

export function sumItems(items: Item[]) {
  return items.reduce((total, item) => total + calculateAmountArs(item), 0);
}

function getGroupStatus(
  day: number | "none",
  items: Item[],
  currentDay?: number,
): PaymentGroupStatus {
  const hasPending = items.some((item) => !item.completed);

  if (!hasPending || day === "none" || currentDay === undefined) {
    return "normal";
  }

  if (day < currentDay) {
    return "overdue";
  }

  if (day === currentDay) {
    return "today";
  }

  return "normal";
}
