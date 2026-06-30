import { AlertTriangle } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import type { Item } from "@/features/items/types";

type DeleteItemDialogProps = {
  item: Item | null;
  onCancel: () => void;
  onConfirm: (item: Item) => void;
};

export function DeleteItemDialog({ item, onCancel, onConfirm }: DeleteItemDialogProps) {
  if (!item) {
    return null;
  }

  return (
    <AppModal
      open
      onClose={onCancel}
      title="Eliminar item"
      closeAriaLabel="Cerrar diálogo"
      icon={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </span>
      }
      description={`Se va a eliminar "${item.concept}" de este mes.`}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => onConfirm(item)}>
            Eliminar
          </Button>
        </div>
      }
    />
  );
}
