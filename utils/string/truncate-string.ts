type SlugifyOptions = {
  maxLength?: number;
  separator?: string;
};

function slugify(text: string, options: SlugifyOptions = {}): string {
  const { maxLength = 60, separator = "-" } = options;

  if (!text) {
    return "";
  }

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Supprime les caractères spéciaux
    .replace(/[\s_]+/g, separator) // Remplace espaces et underscores
    .replace(new RegExp(`${separator}+`, "g"), separator) // Évite les séparateurs multiples
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "") // Trim les séparateurs
    .slice(0, maxLength);
}

export { slugify };

export type { SlugifyOptions };
