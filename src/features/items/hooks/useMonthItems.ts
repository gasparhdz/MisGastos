import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ItemFormValues } from "@/features/items/schemas/item.schema";
import {
  copyPreviousMonthItems,
  createItem,
  deleteItem as deleteRemoteItem,
  listItems,
  toggleItemCompleted,
  updateItem,
} from "@/features/items/services/items.service";
import type { Item, ItemInput } from "@/features/items/types";
import { groupPaymentsByDueDay, sortByDueDay } from "@/features/items/utils";
import { getPreviousMonth, type MonthSelection } from "@/features/month/utils";
import { calculateMonthSummary } from "@/features/summary/utils/calculateMonthSummary";

export function useMonthItems(userId: string | null, selectedMonth: MonthSelection) {
  const queryClient = useQueryClient();
  const queryKey = ["items", userId, selectedMonth.year, selectedMonth.month] as const;
  const previousMonth = getPreviousMonth(selectedMonth);

  const itemsQuery = useQuery({
    queryKey,
    queryFn: () => listItems(userId!, selectedMonth.year, selectedMonth.month),
    enabled: Boolean(userId),
  });

  const invalidateItems = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (input: ItemInput) => createItem(userId!, input),
    onSuccess: invalidateItems,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ItemInput }) => updateItem(id, input),
    onSuccess: invalidateItems,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRemoteItem(id),
    onSuccess: invalidateItems,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleItemCompleted(id, completed),
    onSuccess: invalidateItems,
  });

  const copyPreviousMonthMutation = useMutation({
    mutationFn: () =>
      copyPreviousMonthItems(
        userId!,
        previousMonth.year,
        previousMonth.month,
        selectedMonth.year,
        selectedMonth.month,
      ),
    onSuccess: invalidateItems,
  });

  const items = itemsQuery.data ?? [];
  const payments = useMemo(
    () => items.filter((item) => item.type === "PAY").sort(sortByDueDay),
    [items],
  );
  const collections = useMemo(
    () => items.filter((item) => item.type === "COLLECT").sort(sortByDueDay),
    [items],
  );
  const paymentGroups = useMemo(
    () =>
      groupPaymentsByDueDay(payments, {
        currentDay: selectedMonth.currentDay,
        monthLabel: selectedMonth.shortMonth,
      }),
    [payments, selectedMonth.currentDay, selectedMonth.shortMonth],
  );
  const summary = useMemo(() => calculateMonthSummary(items), [items]);
  const nextPayment = payments.find((item) => !item.completed);
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleMutation.isPending ||
    copyPreviousMonthMutation.isPending;

  function create(values: ItemFormValues) {
    return createMutation.mutateAsync(toItemInput(values, selectedMonth));
  }

  function update(item: Item, values: ItemFormValues) {
    return updateMutation.mutateAsync({
      id: item.id,
      input: toItemInput(values, selectedMonth),
    });
  }

  function remove(item: Item) {
    return deleteMutation.mutateAsync(item.id);
  }

  function toggleCompleted(item: Item) {
    return toggleMutation.mutateAsync({
      id: item.id,
      completed: !item.completed,
    });
  }

  function copyPreviousMonth() {
    return copyPreviousMonthMutation.mutateAsync();
  }

  return {
    collections,
    copyPreviousMonth,
    copyPreviousMonthMutation,
    create,
    items,
    itemsQuery,
    isMutating,
    nextPayment,
    paymentGroups,
    payments,
    remove,
    summary,
    toggleCompleted,
    update,
  };
}

function toItemInput(values: ItemFormValues, selectedMonth: MonthSelection): ItemInput {
  return {
    year: selectedMonth.year,
    month: selectedMonth.month,
    type: values.type,
    concept: values.concept,
    currency: values.currency,
    originalAmount: values.originalAmount,
    usdRate: values.currency === "USD" && values.originalAmount > 0 ? values.usdRate : undefined,
    dueDay: values.dueDay,
    completed: values.completed,
  };
}

