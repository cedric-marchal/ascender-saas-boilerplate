import type { PrismaClient } from "../../lib/generated/prisma/client";
import {
  daysAgo,
  daysFromNow,
  generateSlug,
  getHashedPassword,
  hoursFromNow,
  SEED_FILTER,
  seedId,
} from "./helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserSeed = {
  index: number;
  name: string;
  email: string;
  emailVerified: boolean;
  role: "ADMIN" | "CUSTOMER";
  image: string | null;
  createdAt: Date;
  hasSession: boolean;
  hasStripeCustomer: boolean;
  provider: "credential" | "google";
  googleAccountId?: string;
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const USERS: UserSeed[] = [
  // ---- Admins ----
  {
    index: 1,
    name: "Cédric Morel",
    email: "cedric@ascender.dev",
    emailVerified: true,
    role: "ADMIN",
    image: "https://picsum.photos/id/23/200/200",
    createdAt: daysAgo(180),
    hasSession: true,
    hasStripeCustomer: false,
    provider: "credential",
  },
  {
    index: 2,
    name: "Amélie Fontaine",
    email: "amelie.fontaine@ascender.dev",
    emailVerified: true,
    role: "ADMIN",
    image: null,
    createdAt: daysAgo(120),
    hasSession: true,
    hasStripeCustomer: false,
    provider: "credential",
  },

  // ---- Customers — verified ----
  {
    index: 3,
    name: "Thomas Lefèvre",
    email: "thomas.lefevre@gmail.com",
    emailVerified: true,
    role: "CUSTOMER",
    image: "https://picsum.photos/id/31/200/200",
    createdAt: daysAgo(90),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "credential",
  },
  {
    index: 4,
    name: "Marine Dubois",
    email: "marine.dubois@outlook.fr",
    emailVerified: true,
    role: "CUSTOMER",
    image: "https://picsum.photos/id/35/200/200",
    createdAt: daysAgo(75),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "google",
    googleAccountId: "114832759201847362910",
  },
  {
    index: 5,
    name: "Lucas Bernard",
    email: "lucas.bernard@protonmail.com",
    emailVerified: true,
    role: "CUSTOMER",
    image: null,
    createdAt: daysAgo(14),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "credential",
  },
  {
    index: 6,
    name: "Camille Roux",
    email: "camille.roux@yahoo.fr",
    emailVerified: true,
    role: "CUSTOMER",
    image: "https://picsum.photos/id/57/200/200",
    createdAt: daysAgo(150),
    hasSession: false,
    hasStripeCustomer: true,
    provider: "credential",
  },
  {
    index: 7,
    name: "Antoine Mercier",
    email: "antoine.mercier@free.fr",
    emailVerified: true,
    role: "CUSTOMER",
    image: "https://picsum.photos/id/67/200/200",
    createdAt: daysAgo(60),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "credential",
  },
  {
    index: 8,
    name: "Chloé Martin",
    email: "chloe.martin@laposte.net",
    emailVerified: true,
    role: "CUSTOMER",
    image: null,
    createdAt: daysAgo(30),
    hasSession: true,
    hasStripeCustomer: false,
    provider: "google",
    googleAccountId: "103948571629384756102",
  },

  // ---- Customers — unverified ----
  {
    index: 9,
    name: "Julien Petit",
    email: "julien.petit@hotmail.fr",
    emailVerified: false,
    role: "CUSTOMER",
    image: null,
    createdAt: daysAgo(2),
    hasSession: true,
    hasStripeCustomer: false,
    provider: "credential",
  },
  {
    index: 10,
    name: "Sophie Lambert",
    email: "sophie.lambert@gmail.com",
    emailVerified: false,
    role: "CUSTOMER",
    image: null,
    createdAt: daysAgo(1),
    hasSession: false,
    hasStripeCustomer: false,
    provider: "credential",
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedAuth(prisma: PrismaClient): Promise<void> {
  const hashedPassword = await getHashedPassword();

  // Users
  for (const user of USERS) {
    await prisma.user.create({
      data: {
        id: seedId("user", user.index),
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        slug: generateSlug(user.name, user.index),
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      },
    });
  }

  // Accounts
  for (const user of USERS) {
    if (user.provider === "google") {
      await prisma.account.create({
        data: {
          id: seedId("account", user.index),
          accountId: user.googleAccountId!,
          providerId: "google",
          userId: seedId("user", user.index),
          accessToken: `fake-seed-access-token-${user.index}`,
          refreshToken: `fake-seed-refresh-token-${user.index}`,
          idToken: null,
          accessTokenExpiresAt: hoursFromNow(1),
          refreshTokenExpiresAt: null,
          scope: "openid email profile",
          password: null,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        },
      });
    } else {
      await prisma.account.create({
        data: {
          id: seedId("account", user.index),
          accountId: seedId("user", user.index),
          providerId: "credential",
          userId: seedId("user", user.index),
          accessToken: null,
          refreshToken: null,
          idToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
          password: hashedPassword,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        },
      });
    }
  }

  // Sessions
  const usersWithSessions = USERS.filter((user: UserSeed) => user.hasSession);

  for (const user of usersWithSessions) {
    await prisma.session.create({
      data: {
        id: seedId("session", user.index),
        expiresAt: daysFromNow(7),
        token: `seed-session-token-${user.index}`,
        ipAddress: `192.168.1.${user.index + 10}`,
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        userId: seedId("user", user.index),
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Clean
// ---------------------------------------------------------------------------

async function cleanAuth(prisma: PrismaClient): Promise<void> {
  await prisma.session.deleteMany(SEED_FILTER);
  await prisma.account.deleteMany(SEED_FILTER);
  await prisma.user.deleteMany(SEED_FILTER);
}

export { cleanAuth, seedAuth, USERS, type UserSeed };
