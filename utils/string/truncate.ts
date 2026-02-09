// Universal limits for SEO & UX (based on Google, social media, and interface best practices)
const TITLE_LENGTH = 60; // Titles: Google SEO (~60), Open Graph (~70), Cards (1-2 lines) → 60 is optimal for all
const DESCRIPTION_LENGTH = 160; // Descriptions: Google SEO (~160), Open Graph, Cards (3-4 lines)
const PREVIEW_LENGTH = 200; // Preview text: 4-5 lines (article preview, content excerpt)
const EXCERPT_LENGTH = 300; // Long excerpt: 6-8 lines (blog post preview on homepage)

function truncate(text: string, maxLength: number): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (maxLength < 4) {
    throw new Error("maxLength must be at least 4 for ellipsis");
  }

  const trimmedText = text.trim();

  if (trimmedText.length <= maxLength) {
    return trimmedText;
  }

  return trimmedText.slice(0, maxLength - 3) + "...";
}

function truncateTitle(text: string): string {
  return truncate(text, TITLE_LENGTH);
}

function truncateDescription(text: string): string {
  return truncate(text, DESCRIPTION_LENGTH);
}

function truncatePreview(text: string): string {
  return truncate(text, PREVIEW_LENGTH);
}

function truncateExcerpt(text: string): string {
  return truncate(text, EXCERPT_LENGTH);
}

export {
  truncate,
  truncateTitle,
  truncateDescription,
  truncatePreview,
  truncateExcerpt,
};
