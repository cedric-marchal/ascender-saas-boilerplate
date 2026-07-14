const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const MAX_RELATIVE_DAYS = 365 * 10;

type FormatDateOptions = {
  date: Date | string;
  format?: "short" | "long" | "relative";
  now?: Date;
};

function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function parseDate(date: Date | string): Date | null {
  if (date instanceof Date) {
    return isValidDate(date) ? date : null;
  }

  if (typeof date === "string") {
    const parsed = new Date(date);
    return isValidDate(parsed) ? parsed : null;
  }

  return null;
}

function formatDate({
  date,
  format = "short",
  now,
}: FormatDateOptions): string {
  if (!date) {
    return "";
  }

  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return "";
  }

  if (format === "relative") {
    return formatRelative(parsedDate, now);
  }

  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : { day: "2-digit", month: "2-digit", year: "numeric" };

  try {
    return parsedDate.toLocaleDateString("fr-FR", options);
  } catch {
    return "";
  }
}

function formatRelative(date: Date, currentDate?: Date): string {
  if (!isValidDate(date)) {
    return "";
  }

  const now =
    currentDate && isValidDate(currentDate) ? currentDate : new Date();

  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) {
    return "";
  }

  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays > MAX_RELATIVE_DAYS) {
    return "";
  }

  if (diffDays === 0) {
    return "Aujourd'hui";
  }

  if (diffDays === 1) {
    return "Hier";
  }

  if (diffDays < DAYS_PER_WEEK) {
    return `Il y a ${diffDays} jours`;
  }

  if (diffDays < DAYS_PER_MONTH) {
    const weeks = Math.floor(diffDays / DAYS_PER_WEEK);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }

  if (diffDays < DAYS_PER_YEAR) {
    const months = Math.floor(diffDays / DAYS_PER_MONTH);
    return `Il y a ${months} mois`;
  }

  const years = Math.floor(diffDays / DAYS_PER_YEAR);
  return `Il y a ${years} an${years > 1 ? "s" : ""}`;
}

export { formatDate, formatRelative, isValidDate, parseDate };
export type { FormatDateOptions };
