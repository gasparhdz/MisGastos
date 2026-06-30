import type { Item } from "@/features/items/types";
import { sumItems } from "@/features/items/utils";

export type MonthSummary = {
  pendingPayments: number;
  pendingCollections: number;
  paidPayments: number;
  collectedAmount: number;
  pendingBalance: number;
};

export function calculateMonthSummary(items: Item[]): MonthSummary {
  const payments = items.filter((item) => item.type === "PAY");
  const collections = items.filter((item) => item.type === "COLLECT");
  const pendingPayments = sumItems(payments.filter((item) => !item.completed));
  const pendingCollections = sumItems(collections.filter((item) => !item.completed));

  return {
    pendingPayments,
    pendingCollections,
    paidPayments: sumItems(payments.filter((item) => item.completed)),
    collectedAmount: sumItems(collections.filter((item) => item.completed)),
    pendingBalance: pendingCollections - pendingPayments,
  };
}
