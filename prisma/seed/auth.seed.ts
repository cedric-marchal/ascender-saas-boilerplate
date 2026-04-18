import type { PrismaClient } from "../../lib/generated/prisma/client";
import {
  daysAgo,
  daysFromNow,
  generateSlug,
  getHashedPassword,
  hoursFromNow,
  SEED_FILTER,
  seedId,
  slugify,
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
// User Agent strings (realistic variety)
// ---------------------------------------------------------------------------

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.2535.92",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

// ---------------------------------------------------------------------------
// Name pools for generation
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Adrien",
  "Agathe",
  "Alexandre",
  "Alice",
  "Amandine",
  "Antoine",
  "Arthur",
  "Aurélie",
  "Baptiste",
  "Camille",
  "Caroline",
  "Charlotte",
  "Clara",
  "Clément",
  "Damien",
  "Diane",
  "Élise",
  "Émilie",
  "Emma",
  "Étienne",
  "Fabien",
  "Florian",
  "Gabriel",
  "Guillaume",
  "Hélène",
  "Hugo",
  "Inès",
  "Isabelle",
  "Jacques",
  "Jade",
  "Julien",
  "Juliette",
  "Karine",
  "Laure",
  "Laurent",
  "Léa",
  "Léo",
  "Louis",
  "Louise",
  "Luca",
  "Lucie",
  "Manon",
  "Marc",
  "Margaux",
  "Marie",
  "Mathieu",
  "Mathilde",
  "Maxime",
  "Mélanie",
  "Nathan",
  "Nicolas",
  "Nina",
  "Noah",
  "Nora",
  "Olivier",
  "Pauline",
  "Philippe",
  "Pierre",
  "Raphaël",
  "Romain",
  "Sarah",
  "Simon",
  "Solène",
  "Sophie",
  "Théo",
  "Thomas",
  "Valentin",
  "Valentine",
  "Victor",
  "Virginie",
  "Xavier",
  "Yanis",
  "Zoé",
];

const LAST_NAMES = [
  "Adam",
  "Arnaud",
  "Barbier",
  "Barre",
  "Benoit",
  "Bertrand",
  "Blanc",
  "Bonnet",
  "Boucher",
  "Boyer",
  "Brun",
  "Caron",
  "Carpentier",
  "Charpentier",
  "Chevalier",
  "Colin",
  "Collet",
  "Costa",
  "David",
  "Denis",
  "Deschamps",
  "Dufour",
  "Dumont",
  "Dupont",
  "Dupuis",
  "Durand",
  "Fabre",
  "Fernandez",
  "Fleury",
  "Fontaine",
  "Fournier",
  "Garnier",
  "Gauthier",
  "Gérard",
  "Girard",
  "Giraud",
  "Guérin",
  "Guillaume",
  "Henry",
  "Hubert",
  "Joly",
  "Lambert",
  "Laurent",
  "Leblanc",
  "Leclerc",
  "Lefebvre",
  "Legrand",
  "Lemaire",
  "Lemoine",
  "Leroux",
  "Leroy",
  "Lopez",
  "Marchand",
  "Marie",
  "Martin",
  "Mathieu",
  "Mercier",
  "Meyer",
  "Michel",
  "Morel",
  "Moreau",
  "Moulin",
  "Muller",
  "Noel",
  "Olivier",
  "Paris",
  "Perrin",
  "Petit",
  "Philippe",
  "Picard",
  "Renard",
  "Renaud",
  "Rey",
  "Richard",
  "Robert",
  "Robin",
  "Roche",
  "Rodriguez",
  "Roger",
  "Rolland",
  "Rousseau",
  "Roussel",
  "Roy",
  "Simon",
  "Thomas",
  "Vidal",
  "Vincent",
];

const EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.fr",
  "hotmail.fr",
  "yahoo.fr",
  "free.fr",
  "orange.fr",
  "sfr.fr",
  "laposte.net",
  "protonmail.com",
  "icloud.com",
];

// Deterministic picsum IDs (valid, varied images)
const PICSUM_IDS = [
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
  67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
  86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103,
  104, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
  120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130,
];

// ---------------------------------------------------------------------------
// Generator — deterministic from index
// ---------------------------------------------------------------------------

function generateUser(index: number): UserSeed {
  const firstName = FIRST_NAMES[(index - 17) % FIRST_NAMES.length]!;
  const lastName = LAST_NAMES[(index - 17) % LAST_NAMES.length]!;
  const name = `${firstName} ${lastName}`;

  const emailSlug = slugify(name).replace(/-/g, ".");
  const domain = EMAIL_DOMAINS[(index - 17) % EMAIL_DOMAINS.length]!;
  const email = `${emailSlug}@${domain}`;

  const isGoogle = index % 5 === 0;
  const hasImage = index % 3 !== 0;
  const picsumId = PICSUM_IDS[(index - 17) % PICSUM_IDS.length]!;
  const daysOld = 1 + ((index * 7) % 360);

  // ~5% unverified
  const emailVerified = index % 20 !== 0;

  // ~80% have sessions
  const hasSession = index % 5 !== 0;

  // ~60% have Stripe customer
  const hasStripeCustomer = emailVerified && index % 5 < 3;

  return {
    index,
    name,
    email,
    emailVerified,
    role: "CUSTOMER",
    image: hasImage ? `https://picsum.photos/id/${picsumId}/200/200` : null,
    createdAt: daysAgo(daysOld),
    hasSession,
    hasStripeCustomer,
    provider: isGoogle ? "google" : "credential",
    ...(isGoogle
      ? { googleAccountId: `1${index.toString().padStart(20, "0")}` }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Data — hand-crafted edge cases (1-16) + generated (17-216)
// ---------------------------------------------------------------------------

const MANUAL_USERS: UserSeed[] = [
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

  // ---- Boundary: min length ----
  {
    index: 11,
    name: "A B",
    email: "a@b.fr",
    emailVerified: true,
    role: "CUSTOMER",
    image: null,
    createdAt: daysAgo(5),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "credential",
  },

  // ---- Boundary: max length ----
  {
    index: 12,
    name: "Jean-Baptiste de La Rochefoucauld-Montmorency",
    email: "jean-baptiste.rochefoucauld-montmorency@entreprise-exemple.fr",
    emailVerified: true,
    role: "CUSTOMER",
    image: "https://picsum.photos/id/82/200/200",
    createdAt: daysAgo(365),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "google",
    googleAccountId: "109283746501928374650",
  },

  // ---- Stripe customer, no subscription (abandoned checkout) ----
  {
    index: 13,
    name: "Emma Girard",
    email: "emma.girard@icloud.com",
    emailVerified: true,
    role: "CUSTOMER",
    image: "https://picsum.photos/id/91/200/200",
    createdAt: daysAgo(45),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "credential",
  },

  // ---- Subscription: INCOMPLETE ----
  {
    index: 14,
    name: "Hugo Leroy",
    email: "hugo.leroy@orange.fr",
    emailVerified: true,
    role: "CUSTOMER",
    image: null,
    createdAt: daysAgo(10),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "credential",
  },

  // ---- Subscription: UNPAID + expired session ----
  {
    index: 15,
    name: "Léa Moreau",
    email: "lea.moreau@sfr.fr",
    emailVerified: true,
    role: "CUSTOMER",
    image: "https://picsum.photos/id/100/200/200",
    createdAt: daysAgo(200),
    hasSession: true,
    hasStripeCustomer: true,
    provider: "credential",
  },

  // ---- Subscription: PAUSED, no session ----
  {
    index: 16,
    name: "Nathan Fournier",
    email: "nathan.fournier@gmail.com",
    emailVerified: true,
    role: "CUSTOMER",
    image: null,
    createdAt: daysAgo(100),
    hasSession: false,
    hasStripeCustomer: true,
    provider: "credential",
  },
];

const GENERATED_USERS: UserSeed[] = Array.from(
  { length: 200 },
  (_: unknown, index: number) => generateUser(index + 17),
);

const USERS: UserSeed[] = [...MANUAL_USERS, ...GENERATED_USERS];

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

type SessionSeed = {
  userIndex: number;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
};

function getSessionsForUsers(): SessionSeed[] {
  const usersWithSessions = USERS.filter((user: UserSeed) => user.hasSession);

  return usersWithSessions.map((user: UserSeed, index: number) => {
    // Boundary: user 11 (min) — null IP and null UA
    if (user.index === 11) {
      return {
        userIndex: user.index,
        ipAddress: null,
        userAgent: null,
        expiresAt: daysFromNow(7),
        createdAt: daysAgo(1),
      };
    }

    // Boundary: user 12 (max) — IPv6
    if (user.index === 12) {
      return {
        userIndex: user.index,
        ipAddress: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        userAgent: USER_AGENTS[3]!,
        expiresAt: daysFromNow(7),
        createdAt: daysAgo(1),
      };
    }

    // User 15 — expired session
    if (user.index === 15) {
      return {
        userIndex: user.index,
        ipAddress: "10.0.0.42",
        userAgent: USER_AGENTS[4]!,
        expiresAt: daysAgo(2),
        createdAt: daysAgo(10),
      };
    }

    // Every 30th generated user gets IPv6
    const isIpv6 = user.index > 16 && user.index % 30 === 0;
    const ipAddress = isIpv6
      ? `2001:0db8:85a3::${user.index.toString(16)}`
      : `${10 + (user.index % 3)}.${(user.index * 3) % 256}.${(user.index * 7) % 256}.${((user.index * 11) % 254) + 1}`;

    return {
      userIndex: user.index,
      ipAddress,
      userAgent: USER_AGENTS[index % USER_AGENTS.length]!,
      expiresAt: daysFromNow(1 + (index % 14)),
      createdAt: daysAgo(1 + (index % 30)),
    };
  });
}

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
  const sessions = getSessionsForUsers();

  for (const session of sessions) {
    await prisma.session.create({
      data: {
        id: seedId("session", session.userIndex),
        expiresAt: session.expiresAt,
        token: `seed-session-token-${session.userIndex}`,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        userId: seedId("user", session.userIndex),
        createdAt: session.createdAt,
        updatedAt: session.createdAt,
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
