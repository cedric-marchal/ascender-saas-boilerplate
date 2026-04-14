import { hashPassword } from "better-auth/crypto";

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

const SEED_PASSWORD = "SeedPassword42!";

async function getHashedPassword(): Promise<string> {
  return hashPassword(SEED_PASSWORD);
}

// ---------------------------------------------------------------------------
// Slug generation (matches app's slugify + unique suffix pattern)
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function generateSlug(name: string, index: number): string {
  const base = slugify(name) || "utilisateur";
  const suffix = `seed${index.toString().padStart(2, "0")}`;

  return `${base}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Deterministic ID helpers
// ---------------------------------------------------------------------------

function seedId(prefix: string, index: number): string {
  return `seed-${prefix}-${index.toString().padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const NOW = new Date();

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Seed filter (used for cleanup)
// ---------------------------------------------------------------------------

const SEED_FILTER = { where: { id: { startsWith: "seed-" } } };

export {
  daysAgo,
  daysFromNow,
  generateSlug,
  getHashedPassword,
  hoursFromNow,
  SEED_FILTER,
  seedId,
  SEED_PASSWORD,
  slugify,
};
