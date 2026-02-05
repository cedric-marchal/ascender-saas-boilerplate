type FormatDateOptions = {
  date: Date | string;
  format?: "short" | "long" | "relative";
};

function formatDate({ date, format = "short" }: FormatDateOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return formatRelative(d);
  }

  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : { day: "2-digit", month: "2-digit", year: "numeric" };

  return d.toLocaleDateString("fr-FR", options);
}

function formatRelative(date: Date): string {
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Aujourd'hui";
  }

  if (diffDays === 1) {
    return "Hier";
  }

  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }

  if (diffDays < 30) {
    return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  }

  if (diffDays < 365) {
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
}

export { formatDate };
export type { FormatDateOptions };
