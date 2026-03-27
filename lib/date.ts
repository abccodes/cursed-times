export const PRODUCT_TIMEZONE = "America/New_York";
export const MIN_ARCHIVE_YEAR = 1851;
export const DEFAULT_YEAR_GAP = 10;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PRODUCT_TIMEZONE,
  month: "long",
  day: "numeric",
  year: "numeric",
});

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRODUCT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getAnchorDateParts(now = new Date()) {
  const parts = partsFormatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

export function getYearBounds(now = new Date()) {
  const anchor = getAnchorDateParts(now);

  return {
    minYear: MIN_ARCHIVE_YEAR,
    maxYear: anchor.year - 1,
    defaultYear: Math.max(MIN_ARCHIVE_YEAR, anchor.year - DEFAULT_YEAR_GAP),
  };
}

export function parseYear(rawYear: string | null | undefined, now = new Date()) {
  const { minYear, maxYear, defaultYear } = getYearBounds(now);
  const numericYear = Number(rawYear);

  if (!Number.isInteger(numericYear)) {
    return defaultYear;
  }

  return clampYear(numericYear, minYear, maxYear);
}

export function getDateInfo(selectedYear: number, now = new Date()) {
  const anchor = getAnchorDateParts(now);
  const { minYear, maxYear, defaultYear } = getYearBounds(now);
  const targetYear = clampYear(selectedYear, minYear, maxYear);
  const targetDay = clampDayToMonth(targetYear, anchor.month, anchor.day);
  const anchorDate = toIsoDate(anchor.year, anchor.month, anchor.day);
  const targetDate = toIsoDate(targetYear, anchor.month, targetDay);

  return {
    selectedYear: targetYear,
    defaultYear,
    minYear,
    maxYear,
    timezone: PRODUCT_TIMEZONE,
    anchorDate,
    targetDate,
    anchorDateLabel: dateFormatter.format(new Date(`${anchorDate}T12:00:00Z`)),
    targetDateLabel: dateFormatter.format(new Date(`${targetDate}T12:00:00Z`)),
    usedFallbackDay: targetDay !== anchor.day,
  };
}

function clampYear(year: number, minYear: number, maxYear: number) {
  return Math.max(minYear, Math.min(maxYear, year));
}

function clampDayToMonth(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.min(day, lastDay);
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
