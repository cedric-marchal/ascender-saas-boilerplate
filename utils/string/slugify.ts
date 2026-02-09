const MAX_SLUG_LENGTH = 100;

function slugify(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return "";
  }

  return trimmedText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

export { slugify };
