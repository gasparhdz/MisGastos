export type MonthSelection = {
  year: number;
  month: number;
  label: string;
  shortMonth: string;
  currentDay?: number;
};

export type YearMonth = {
  year: number;
  month: number;
};

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});

const shortMonthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "short",
});

export function getCurrentMonthSelection(date = new Date()): MonthSelection {
  return buildMonthSelection(date.getFullYear(), date.getMonth() + 1, date);
}

export function buildMonthSelection(
  year: number,
  month: number,
  today = new Date(),
): MonthSelection {
  const selectedDate = new Date(year, month - 1, 1);
  const label = monthFormatter.format(selectedDate);
  const shortMonth = shortMonthFormatter
    .format(selectedDate)
    .replace(".", "")
    .toUpperCase();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  return {
    year,
    month,
    label: capitalize(label),
    shortMonth,
    currentDay: isCurrentMonth ? today.getDate() : undefined,
  };
}

export function getPreviousMonth({ year, month }: YearMonth): YearMonth {
  if (month === 1) {
    return {
      year: year - 1,
      month: 12,
    };
  }

  return {
    year,
    month: month - 1,
  };
}

export function getNextMonth({ year, month }: YearMonth): YearMonth {
  if (month === 12) {
    return {
      year: year + 1,
      month: 1,
    };
  }

  return {
    year,
    month: month + 1,
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
