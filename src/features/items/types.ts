export type ItemType = "PAY" | "COLLECT";

export type Currency = "ARS" | "USD";

export type Item = {
  id: string;
  userId?: string;
  year: number;
  month: number;
  type: ItemType;
  concept: string;
  currency: Currency;
  originalAmount: number;
  usdRate?: number;
  amountArs?: number;
  dueDay?: number;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ItemInput = Omit<
  Item,
  "id" | "userId" | "amountArs" | "createdAt" | "updatedAt"
>;

export type PaymentGroupStatus = "normal" | "today" | "overdue";

export type PaymentGroup = {
  key: number | "none";
  label: string;
  items: Item[];
  status: PaymentGroupStatus;
};
