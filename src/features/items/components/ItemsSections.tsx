import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ItemRow } from "@/features/items/components/ItemDisplay";
import type { Item, PaymentGroup } from "@/features/items/types";
import { sumItems } from "@/features/items/utils";
import type { MonthSelection } from "@/features/month/utils";
import { cn } from "@/lib/utils";
import { formatCurrencyArs } from "@/utils/currency";

type ItemCallbacks = {
  onDelete: (item: Item) => void;
  onEdit: (item: Item) => void;
  onToggle: (item: Item) => void;
};

type CollapsibleSectionHeaderProps = {
  collapsed: boolean;
  count: number;
  description: string;
  quiet?: boolean;
  title: string;
  onToggle: () => void;
};

function CollapsibleSectionHeader({
  collapsed,
  count,
  description,
  onToggle,
  quiet = false,
  title,
}: CollapsibleSectionHeaderProps) {
  const Icon = collapsed ? ChevronRight : ChevronDown;

  return (
    <button className="flex w-full items-end justify-between gap-4 text-left" onClick={onToggle} type="button">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h2 className={cn("text-base font-bold uppercase tracking-normal", quiet && "text-muted-foreground")}>{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{count}</p>
    </button>
  );
}

type PaymentsSectionProps = ItemCallbacks & {
  collapsed: boolean;
  disabled: boolean;
  onToggleCollapsed: () => void;
  paymentGroups: PaymentGroup[];
  paymentsCount: number;
};

export function PaymentsSection({
  collapsed,
  disabled,
  onDelete,
  onEdit,
  onToggle,
  onToggleCollapsed,
  paymentGroups,
  paymentsCount,
}: PaymentsSectionProps) {
  return (
    <section className="space-y-4">
      <CollapsibleSectionHeader
        collapsed={collapsed}
        title="Pagos"
        description="Ordenados por vencimiento"
        count={paymentsCount}
        onToggle={onToggleCollapsed}
      />
      {!collapsed ? (
        <div className="space-y-6">
          {paymentGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-bold uppercase tracking-normal",
                      group.status === "overdue" && "text-amber-700",
                      group.status === "today" && "text-primary",
                    )}
                  >
                    {group.label}
                  </p>
                  {group.status === "today" && <StatusPill tone="today">Hoy</StatusPill>}
                  {group.status === "overdue" && <StatusPill tone="overdue">Vencido</StatusPill>}
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {formatCurrencyArs(sumItems(group.items.filter((item) => !item.completed)))}
                </p>
              </div>
              <Card
                className={cn(
                  "overflow-hidden shadow-none",
                  group.status === "overdue" && "border-amber-200 bg-amber-50/70",
                  group.status === "today" && "border-primary/30 bg-primary/5",
                )}
              >
                <CardContent className="divide-y p-0">
                  {group.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      important
                      onDelete={() => onDelete(item)}
                      onEdit={() => onEdit(item)}
                      onToggle={() => onToggle(item)}
                      disabled={disabled}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

type CollectionsSectionProps = ItemCallbacks & {
  collapsed: boolean;
  collections: Item[];
  disabled: boolean;
  onToggleCollapsed: () => void;
};

export function CollectionsSection({
  collapsed,
  collections,
  disabled,
  onDelete,
  onEdit,
  onToggle,
  onToggleCollapsed,
}: CollectionsSectionProps) {
  return (
    <section className="space-y-3 pb-10">
      <CollapsibleSectionHeader
        collapsed={collapsed}
        title="Cobros"
        description="Pendientes de devolucion"
        count={collections.length}
        quiet
        onToggle={onToggleCollapsed}
      />
      {!collapsed ? (
        <Card className="overflow-hidden bg-card/70 shadow-none">
          <CardContent className="divide-y p-0">
            {collections.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onDelete={() => onDelete(item)}
                onEdit={() => onEdit(item)}
                onToggle={() => onToggle(item)}
                disabled={disabled}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

export function formatDueLabel(day: number | undefined, selectedMonth: MonthSelection) {
  if (!day) {
    return "Sin vencimiento";
  }

  if (day === selectedMonth.currentDay) {
    return `Hoy, ${String(selectedMonth.currentDay).padStart(2, "0")} ${selectedMonth.shortMonth}`;
  }

  return `${String(day).padStart(2, "0")} ${selectedMonth.shortMonth}`;
}

function StatusPill({ children, tone }: { children: ReactNode; tone: "today" | "overdue" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold",
        tone === "today" && "bg-primary/10 text-primary",
        tone === "overdue" && "bg-amber-100 text-amber-800",
      )}
    >
      {children}
    </span>
  );
}
