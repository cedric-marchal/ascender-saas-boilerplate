import type {
  PrismaClient,
  ProjectStatus,
} from "../../src/lib/generated/prisma/client";
import { daysAgo, SEED_FILTER, seedId } from "./helpers";
import { DEMO_ORG_A_ID, orgIdForUser } from "./organization.seed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProjectSeed = {
  index: number;
  organizationId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Data — Demo Org A gets a full spread of projects (many, all statuses,
// boundary name/description lengths) to stress-test the list UI.
// Demo Org B intentionally gets none (empty state coverage).
// Personal orgs (users 3-5) get one project each for realism.
// ---------------------------------------------------------------------------

const PROJECTS: ProjectSeed[] = [
  // ---- Boundary: minimum length name, no description ----
  {
    index: 1,
    organizationId: DEMO_ORG_A_ID,
    name: "A B",
    description: null,
    status: "DRAFT",
    createdAt: daysAgo(40),
  },
  // ---- Boundary: maximum length name + long description ----
  {
    index: 2,
    organizationId: DEMO_ORG_A_ID,
    name: "Refonte complète de la plateforme e-commerce internationale multi-devises",
    description:
      "Ce projet couvre la refonte complète du parcours d'achat, l'intégration de nouveaux moyens de paiement locaux, la traduction dans douze langues et la mise en conformité RGPD pour l'ensemble des marchés européens et nord-américains ciblés par l'entreprise cette année.",
    status: "ACTIVE",
    createdAt: daysAgo(38),
  },
  {
    index: 3,
    organizationId: DEMO_ORG_A_ID,
    name: "Migration infrastructure cloud",
    description: "Migration des services vers Kubernetes.",
    status: "ACTIVE",
    createdAt: daysAgo(35),
  },
  {
    index: 4,
    organizationId: DEMO_ORG_A_ID,
    name: "Application mobile v2",
    description: null,
    status: "ACTIVE",
    createdAt: daysAgo(30),
  },
  {
    index: 5,
    organizationId: DEMO_ORG_A_ID,
    name: "Audit sécurité annuel",
    description: "Revue complète des accès et des dépendances.",
    status: "ARCHIVED",
    createdAt: daysAgo(200),
  },
  {
    index: 6,
    organizationId: DEMO_ORG_A_ID,
    name: "Programme de fidélité",
    description: "Système de points et récompenses clients.",
    status: "DRAFT",
    createdAt: daysAgo(20),
  },
  {
    index: 7,
    organizationId: DEMO_ORG_A_ID,
    name: "Refonte identité visuelle",
    description: null,
    status: "ARCHIVED",
    createdAt: daysAgo(180),
  },
  {
    index: 8,
    organizationId: DEMO_ORG_A_ID,
    name: "Intégration CRM",
    description: "Connexion bidirectionnelle avec le CRM existant.",
    status: "ACTIVE",
    createdAt: daysAgo(15),
  },
  {
    index: 9,
    organizationId: DEMO_ORG_A_ID,
    name: "Portail partenaires",
    description: "Espace dédié aux revendeurs et distributeurs.",
    status: "DRAFT",
    createdAt: daysAgo(10),
  },
  {
    index: 10,
    organizationId: DEMO_ORG_A_ID,
    name: "Optimisation SEO",
    description: null,
    status: "ACTIVE",
    createdAt: daysAgo(8),
  },
  {
    index: 11,
    organizationId: DEMO_ORG_A_ID,
    name: "Refonte documentation technique",
    description: "Centralisation de la documentation interne.",
    status: "DRAFT",
    createdAt: daysAgo(5),
  },
  {
    index: 12,
    organizationId: DEMO_ORG_A_ID,
    name: "Programme d'onboarding client",
    description: "Parcours guidé pour les nouveaux clients.",
    status: "ACTIVE",
    createdAt: daysAgo(2),
  },

  // ---- Personal orgs — one project each for realism ----
  {
    index: 13,
    organizationId: orgIdForUser(3),
    name: "Site vitrine",
    description: "Refonte du site vitrine principal.",
    status: "ACTIVE",
    createdAt: daysAgo(25),
  },
  {
    index: 14,
    organizationId: orgIdForUser(4),
    name: "Application interne",
    description: null,
    status: "DRAFT",
    createdAt: daysAgo(12),
  },
  {
    index: 15,
    organizationId: orgIdForUser(5),
    name: "Archive projet historique",
    description: "Ancien projet conservé pour référence.",
    status: "ARCHIVED",
    createdAt: daysAgo(300),
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedProjects(prisma: PrismaClient): Promise<void> {
  for (const project of PROJECTS) {
    await prisma.project.create({
      data: {
        id: seedId("project", project.index),
        organizationId: project.organizationId,
        name: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.createdAt,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Clean
// ---------------------------------------------------------------------------

async function cleanProjects(prisma: PrismaClient): Promise<void> {
  await prisma.project.deleteMany(SEED_FILTER);
}

export { cleanProjects, seedProjects };
