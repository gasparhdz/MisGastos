import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODAL_Z_INDEX = 100;

let modalLockCount = 0;
let previousBodyOverflow = "";

function lockBodyScroll() {
  if (modalLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  modalLockCount += 1;
}

function unlockBodyScroll() {
  modalLockCount = Math.max(0, modalLockCount - 1);

  if (modalLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

export type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  icon?: ReactNode;
  size?: "sm" | "lg";
  footer?: ReactNode;
  children?: ReactNode;
  closeAriaLabel?: string;
  className?: string;
};

export function AppModal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  icon,
  size = "sm",
  footer,
  children,
  closeAriaLabel = "Cerrar",
  className,
}: AppModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    lockBodyScroll();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const hasBody = Boolean(description) || Boolean(children);

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: MODAL_Z_INDEX }} role="presentation">
      <div
        className="fixed inset-0 animate-in bg-foreground/40 backdrop-blur-sm duration-200 fade-in-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 flex h-[100dvh] items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-modal-title"
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "pointer-events-auto",
            "flex max-h-[100dvh] w-full flex-col overflow-hidden border bg-background shadow-xl",
            "animate-in duration-300 fade-in-0 slide-in-from-bottom-full",
            "sm:max-h-[92vh] sm:duration-200 sm:slide-in-from-bottom-0 sm:zoom-in-95",
            "rounded-t-2xl sm:rounded-lg",
            size === "lg" ? "sm:max-w-lg" : "sm:max-w-sm",
            className,
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {icon ? <div className="shrink-0">{icon}</div> : null}
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    {eyebrow}
                  </p>
                ) : null}
                <h2 id="app-modal-title" className={cn("text-lg font-bold", eyebrow && "mt-1")}>
                  {title}
                </h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onClose}
              aria-label={closeAriaLabel}
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          {hasBody ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
              {children ? (
                <div className={cn(description && "mt-4")}>{children}</div>
              ) : null}
            </div>
          ) : null}

          {footer ? (
            <footer className="shrink-0 border-t px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
