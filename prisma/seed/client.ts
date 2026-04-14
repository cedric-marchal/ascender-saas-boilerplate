import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../../lib/generated/prisma/client";

if (process.env["NODE_ENV"] === "production") {
  throw new Error("Seed script must not run in production");
}

const DATABASE_URL = process.env["DATABASE_URL"];

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
});

export { prisma };
