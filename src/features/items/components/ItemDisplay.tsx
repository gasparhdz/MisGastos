import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { Item } from "@/features/items/types";
import { calculateAmountArs } from "@/features/items/utils";
import { cn } from "@/lib/utils";
import { formatCurrencyArs, formatCurrencyUsd } from "@/utils/currency";

export function SectionHeader({
  title,
  description,
  count,
  quiet = false,
}: {
  title: string;
  description: string;
  count: number;
  quiet?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className={cn("text-base font-bold uppercase tracking-normal", quiet && "text-muted-foreground")}>{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{count}</p>
    </div>
  );
}

export function ItemRow({
  item,
  important = false,
  onDelete,
  onEdit,
  onToggle,
  disabled = false,
}: {
  item: Item;
  important?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const amount = calculateAmountArs(item);

  return (
    <div className={cn("flex min-h-16 items-center gap-3 px-3 py-3 sm:px-4", item.completed && "opacity-55")}>
      <Checkbox checked={item.completed} disabled={disabled} onChange={onToggle} aria-label={`Marcar ${item.concept}`} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn("truncate font-medium", important ? "text-base" : "text-sm", item.completed && "text-muted-foreground line-through")}>{item.concept}</p>
        {item.currency === "USD" && item.usdRate ? (
          <p className="truncate text-xs font-medium text-muted-foreground">
            {formatCurrencyUsd(item.originalAmount)} x {formatCurrencyArs(item.usdRate)} = {formatCurrencyArs(amount)}
          </p>
        ) : null}
      </div>
      <p className={cn("shrink-0 text-right font-semibold", important ? "text-base" : "text-sm", item.completed && "text-muted-foreground line-through")}>{formatCurrencyArs(amount)}</p>
      <div className={cn("flex shrink-0 items-center", !important && "-mr-2")}>
        <Button variant="ghost" size="icon" aria-label={`Editar ${item.concept}`} disabled={disabled} onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Eliminar ${item.concept}`} disabled={disabled} onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 p-4 text-sm font-medium text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Cargando items del mes...
      </CardContent>
    </Card>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5 shadow-none">
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="font-semibold text-destructive">No pude cargar los items</p>
          <p className="mt-1 text-sm text-muted-foreground">Revisá la conexión o intentá de nuevo.</p>
        </div>
        <Button variant="outline" onClick={onRetry}>Reintentar</Button>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="space-y-3 p-5 text-center">
        <div>
          <p className="font-semibold">Este mes todavía no tiene items</p>
          <p className="mt-1 text-sm text-muted-foreground">Cargá el primer pago o cobro para empezar a ordenar el mes.</p>
        </div>
        <Button className="gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Nuevo item
        </Button>
      </CardContent>
    </Card>
  );
}
