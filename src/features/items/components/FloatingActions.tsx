import { Copy, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FloatingActionsProps = {
  disabled?: boolean;
  open: boolean;
  onCopyPrevious: () => void;
  onCreate: () => void;
  onToggleOpen: () => void;
};

export function FloatingActions({
  disabled = false,
  open,
  onCopyPrevious,
  onCreate,
  onToggleOpen,
}: FloatingActionsProps) {
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      <div
        className={cn(
          "flex flex-col items-end gap-2 transition-all",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <ActionButton disabled={disabled} icon={<Copy className="h-4 w-4" />} onClick={onCopyPrevious}>
          Copiar anterior
        </ActionButton>
        <ActionButton disabled={disabled} icon={<Plus className="h-4 w-4" />} onClick={onCreate}>
          Nuevo item
        </ActionButton>
      </div>

      <Button
        aria-label={open ? "Cerrar acciones" : "Abrir acciones"}
        className="h-14 w-14 rounded-full shadow-lg"
        disabled={disabled && !open}
        onClick={onToggleOpen}
        size="icon"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  icon,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      className="h-10 gap-2 rounded-full bg-card px-4 text-card-foreground shadow-lg hover:bg-accent"
      disabled={disabled}
      onClick={onClick}
      variant="outline"
    >
      {icon}
      {children}
    </Button>
  );
}
