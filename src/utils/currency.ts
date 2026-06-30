export function formatCurrencyArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyUsd(value: number) {
  const amount = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `USD ${amount}`;
}

export function formatSignedCurrencyArs(value: number) {
  const formatted = formatCurrencyArs(Math.abs(value));

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}
