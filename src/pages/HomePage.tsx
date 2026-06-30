import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CopyPreviousMonthDialog } from "@/features/items/components/CopyPreviousMonthDialog";
import { DeleteItemDialog } from "@/features/items/components/DeleteItemDialog";
import { EmptyState, ErrorState, LoadingState } from "@/features/items/components/ItemDisplay";
import { FloatingActions } from "@/features/items/components/FloatingActions";
import {
  CollectionsSection,
  formatDueLabel,
  PaymentsSection,
} from "@/features/items/components/ItemsSections";
import { ItemFormModal } from "@/features/items/components/ItemFormModal";
import { useMonthItems } from "@/features/items/hooks/useMonthItems";
import type { ItemFormValues } from "@/features/items/schemas/item.schema";
import type { Item } from "@/features/items/types";
import { calculateAmountArs } from "@/features/items/utils";
import {
  buildMonthSelection,
  getCurrentMonthSelection,
  getNextMonth,
  getPreviousMonth,
  type MonthSelection,
} from "@/features/month/utils";
import { SummaryCard } from "@/features/summary/components/SummaryCard";
import { NotificationSettingsCard } from "@/features/notifications/components/NotificationSettingsCard";
import { formatCurrencyArs, formatSignedCurrencyArs } from "@/utils/currency";

export function HomePage() {
  const { signOut, userId } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<MonthSelection>(() =>
    getCurrentMonthSelection(),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Item | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [paymentsCollapsed, setPaymentsCollapsed] = useState(false);
  const [collectionsCollapsed, setCollectionsCollapsed] = useState(false);
  const {
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
  } = useMonthItems(userId, selectedMonth);

  function openCreateForm() {
    setActionsOpen(false);
    setEditingItem(null);
    setIsFormOpen(true);
  }

  function openEditForm(item: Item) {
    setEditingItem(item);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingItem(null);
  }

  async function saveItem(values: ItemFormValues) {
    if (editingItem) {
      await update(editingItem, values);
    } else {
      await create(values);
    }

    closeForm();
  }

  async function deleteItem(item: Item) {
    await remove(item);
    setDeleteCandidate(null);
  }

  async function handleCopyPreviousMonth() {
    const copiedItems = await copyPreviousMonth();
    setActionsOpen(false);
    setCopyDialogOpen(false);
    setCopyMessage(
      copiedItems.length === 0
        ? "El mes anterior no tiene items para copiar."
        : `Se copiaron ${copiedItems.length} item(s) del mes anterior.`,
    );
  }

  function requestCopyPreviousMonth() {
    setCopyMessage(null);

    if (items.length > 0) {
      setActionsOpen(false);
      setCopyDialogOpen(true);
      return;
    }

    void handleCopyPreviousMonth();
  }

  function moveMonth(direction: "previous" | "next") {
    const nextMonth =
      direction === "previous"
        ? getPreviousMonth(selectedMonth)
        : getNextMonth(selectedMonth);

    setActionsOpen(false);
    setCopyMessage(null);
    setCopyDialogOpen(false);
    closeForm();
    setDeleteCandidate(null);
    setSelectedMonth(buildMonthSelection(nextMonth.year, nextMonth.month));
  }

  return (
    <div className="space-y-7">
      <header className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => moveMonth("previous")}
            disabled={isMutating}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-center text-sm font-medium text-muted-foreground">Mes seleccionado</p>
            <h1 className="mt-1 text-center text-3xl font-bold tracking-normal">{selectedMonth.label}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => moveMonth("next")}
            disabled={isMutating}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard title="Total a Pagar" value={formatCurrencyArs(summary.pendingPayments)} tone="primary" icon={<WalletCards className="h-4 w-4" />} />
          <SummaryCard title="Total a cobrar" value={formatCurrencyArs(summary.pendingCollections)} tone="soft" icon={<CalendarDays className="h-4 w-4" />} />
          <SummaryCard title="Saldo pendiente" value={formatSignedCurrencyArs(summary.pendingBalance)} tone={summary.pendingBalance < 0 ? "warning" : "positive"} icon={<WalletCards className="h-4 w-4" />} />
          <SummaryCard title="Ya pagaste" value={formatCurrencyArs(summary.paidPayments)} tone="done" icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>

        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-primary">Proximo pago</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextPayment ? `${formatDueLabel(nextPayment.dueDay, selectedMonth)} - ${nextPayment.concept}` : "No quedan pagos pendientes"}
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold">
              {nextPayment ? formatCurrencyArs(calculateAmountArs(nextPayment)) : formatCurrencyArs(0)}
            </p>
          </CardContent>
        </Card>
      </header>

      {copyMessage ? (
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="p-4 text-sm font-medium text-primary">{copyMessage}</CardContent>
        </Card>
      ) : null}

      {itemsQuery.isLoading ? <LoadingState /> : null}
      {itemsQuery.isError ? <ErrorState onRetry={() => void itemsQuery.refetch()} /> : null}
      {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 ? (
        <EmptyState onCreate={openCreateForm} />
      ) : null}

      {!itemsQuery.isLoading && !itemsQuery.isError && items.length > 0 ? (
        <>
          <PaymentsSection
            collapsed={paymentsCollapsed}
            disabled={isMutating}
            onDelete={setDeleteCandidate}
            onEdit={openEditForm}
            onToggle={(item) => void toggleCompleted(item)}
            onToggleCollapsed={() => setPaymentsCollapsed((value) => !value)}
            paymentGroups={paymentGroups}
            paymentsCount={payments.length}
          />
          <CollectionsSection
            collapsed={collectionsCollapsed}
            collections={collections}
            disabled={isMutating}
            onDelete={setDeleteCandidate}
            onEdit={openEditForm}
            onToggle={(item) => void toggleCompleted(item)}
            onToggleCollapsed={() => setCollectionsCollapsed((value) => !value)}
          />
        </>
      ) : null}

      <div className="border-t pt-5 space-y-4">
        <NotificationSettingsCard />
        <Button className="w-full gap-2" variant="outline" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>

      <FloatingActions
        disabled={!userId || isMutating}
        onCopyPrevious={requestCopyPreviousMonth}
        onCreate={openCreateForm}
        onToggleOpen={() => setActionsOpen((value) => !value)}
        open={actionsOpen}
      />
      <ItemFormModal
        item={editingItem}
        onClose={closeForm}
        onSubmit={(values) => void saveItem(values)}
        open={isFormOpen}
      />
      <CopyPreviousMonthDialog
        currentItemsCount={items.length}
        loading={copyPreviousMonthMutation.isPending}
        onCancel={() => setCopyDialogOpen(false)}
        onConfirm={() => void handleCopyPreviousMonth()}
        open={copyDialogOpen}
      />
      <DeleteItemDialog
        item={deleteCandidate}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={(item) => void deleteItem(item)}
      />
    </div>
  );
}
