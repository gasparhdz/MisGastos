import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Item } from "@/features/items/types";
import { calculateAmountArs } from "@/features/items/utils";
import {
  itemFormSchema,
  type ItemFormInput,
  type ItemFormValues,
} from "@/features/items/schemas/item.schema";
import { cn } from "@/lib/utils";
import { formatCurrencyArs, formatCurrencyUsd } from "@/utils/currency";

const FORM_ID = "item-form";

type ItemFormModalProps = {
  open: boolean;
  item?: Item | null;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => void;
};

const emptyValues: ItemFormInput = {
  type: "PAY",
  concept: "",
  currency: "ARS",
  originalAmount: 0,
  usdRate: undefined,
  dueDay: undefined,
  completed: false,
};

export function ItemFormModal({ open, item, onClose, onSubmit }: ItemFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormInput, unknown, ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: emptyValues,
  });

  const currency = watch("currency");
  const originalAmount = Number(watch("originalAmount") || 0);
  const usdRate = Number(watch("usdRate") || 0);
  const originalAmountField = register("originalAmount", { valueAsNumber: true });
  const previewAmount = calculateAmountArs({
    currency,
    originalAmount,
    usdRate: currency === "USD" ? usdRate : undefined,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      item
        ? {
            type: item.type,
            concept: item.concept,
            currency: item.currency,
            originalAmount: item.originalAmount,
            usdRate: item.usdRate,
            dueDay: item.dueDay,
            completed: item.completed,
          }
        : emptyValues,
    );
  }, [item, open, reset]);

  function submit(values: ItemFormValues) {
    onSubmit({
      type: values.type,
      concept: values.concept.trim(),
      currency: values.currency,
      originalAmount: values.originalAmount,
      usdRate: values.currency === "USD" && values.originalAmount > 0 ? values.usdRate : undefined,
      dueDay: values.dueDay,
      completed: values.completed,
    });
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow={item ? "Editar item" : "Nuevo item"}
      title={item ? item.concept : "Cargar movimiento"}
      closeAriaLabel="Cerrar formulario"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} className="flex-1" disabled={isSubmitting}>
            {item ? "Guardar" : "Crear"}
          </Button>
        </div>
      }
    >
      <form
        id={FORM_ID}
        className="space-y-5"
        onSubmit={handleSubmit(submit)}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo" error={errors.type?.message}>
            <Select {...register("type")}>
              <option value="PAY">Pago</option>
              <option value="COLLECT">Cobro</option>
            </Select>
          </Field>

          <Field label="Moneda" error={errors.currency?.message}>
            <Select {...register("currency")}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </Select>
          </Field>
        </div>

        <Field label="Concepto" error={errors.concept?.message}>
          <Input placeholder="Ej: Alquiler" {...register("concept")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Monto" error={errors.originalAmount?.message}>
            <Input
              inputMode="decimal"
              min="0"
              step="0.01"
              type="number"
              placeholder="0"
              {...originalAmountField}
              onBlur={(event) => {
                void originalAmountField.onBlur(event);

                if (event.currentTarget.value === "") {
                  setValue("originalAmount", 0);
                }
              }}
              onFocus={(event) => {
                if (Number(event.currentTarget.value) === 0) {
                  setValue("originalAmount", "");
                }
              }}
            />
          </Field>

          <Field label="Vence" error={errors.dueDay?.message}>
            <Input
              inputMode="numeric"
              min="1"
              max="31"
              type="number"
              placeholder="Opcional"
              {...register("dueDay", { valueAsNumber: true })}
            />
          </Field>
        </div>

        {currency === "USD" && (
          <Field label="Cotizacion USD" error={errors.usdRate?.message}>
            <Input
              inputMode="decimal"
              min="0"
              step="0.01"
              type="number"
              placeholder="Ej: 1250"
              {...register("usdRate", { valueAsNumber: true })}
            />
          </Field>
        )}

        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Preview
          </p>
          <p className="mt-1 text-base font-bold">
            {currency === "USD"
              ? `${formatCurrencyUsd(originalAmount)} x ${formatCurrencyArs(usdRate)} = ${formatCurrencyArs(previewAmount)}`
              : `Total: ${formatCurrencyArs(previewAmount)}`}
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium">
          <input
            className="h-4 w-4 accent-primary"
            type="checkbox"
            {...register("completed")}
          />
          Ya esta pagado/cobrado
        </label>
      </form>
    </AppModal>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className={cn(error && "text-destructive")}>{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
