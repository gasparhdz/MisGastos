import { z } from "zod";

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return undefined;
  }

  return Number(value);
}, z.number().optional());

const requiredNonNegativeNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return undefined;
  }

  return Number(value);
}, z.number({ error: "Ingresá un monto" }).min(0, "El monto debe ser 0 o mayor"));

export const itemFormSchema = z
  .object({
    type: z.enum(["PAY", "COLLECT"], {
      error: "Elegí si es pago o cobro",
    }),
    concept: z.string().trim().min(1, "Ingresá un concepto"),
    currency: z.enum(["ARS", "USD"], {
      error: "Elegí una moneda",
    }),
    originalAmount: requiredNonNegativeNumber,
    usdRate: optionalNumber,
    dueDay: optionalNumber.refine(
      (value) => value === undefined || (value >= 1 && value <= 31),
      "El vencimiento debe estar entre 1 y 31",
    ),
    completed: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (
      value.currency === "USD" &&
      value.originalAmount > 0 &&
      (!value.usdRate || value.usdRate <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresá una cotización mayor a 0",
        path: ["usdRate"],
      });
    }
  });

export type ItemFormInput = z.input<typeof itemFormSchema>;
export type ItemFormValues = z.output<typeof itemFormSchema>;
