import { Copy } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";

type CopyPreviousMonthDialogProps = {
  open: boolean;
  currentItemsCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function CopyPreviousMonthDialog({
  open,
  currentItemsCount,
  onCancel,
  onConfirm,
  loading = false,
}: CopyPreviousMonthDialogProps) {
  return (
    <AppModal
      open={open}
      onClose={onCancel}
      title="Copiar mes anterior"
      closeAriaLabel="Cerrar diálogo"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Copy className="h-5 w-5" />
        </span>
      }
      description={
        currentItemsCount > 0
          ? `Este mes ya tiene ${currentItemsCount} item(s). Se van a sumar copias pendientes del mes anterior.`
          : "Se van a copiar los items del mes anterior como pendientes."
      }
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? "Copiando..." : "Copiar"}
          </Button>
        </div>
      }
    />
  );
}
