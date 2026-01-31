import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

type Plan = {
  name: string;
  description: string;
  price: string;
  period: string | null;
  features: string[];
  cta: string;
  priceId: string | null;
  featured: boolean;
  isFree: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    description: "Pour démarrer et tester la plateforme en solo.",
    price: "0",
    period: "mois",
    features: [
      "1 projet actif",
      "Jusqu'à 3 espaces de travail",
      "Historique limité",
      "Support par e-mail standard",
    ],
    cta: "Commencer gratuitement",
    priceId: null,
    featured: false,
    isFree: true,
  },
  {
    name: "Pro",
    description: `Pour les indépendants et petites équipes qui utilisent ${APP_NAME} au quotidien.`,
    price: "19",
    period: "mois",
    features: [
      "Projets illimités",
      "Utilisateurs illimités dans votre équipe",
      "Historique étendu",
      "Support prioritaire par e-mail",
    ],
    cta: "Choisir l'offre Pro",
    priceId: env.STRIPE_PRICE_ID_PRO,
    featured: true,
    isFree: false,
  },
  {
    name: "Business",
    description: "Pour les équipes avancées et besoins spécifiques.",
    price: "Sur mesure",
    period: null,
    features: [
      "SLA et support dédié",
      "Intégrations avancées",
      "Accompagnement à l'onboarding",
      "Conditions contractuelles personnalisées",
    ],
    cta: "Parler avec l'équipe",
    priceId: null,
    featured: false,
    isFree: false,
  },
];

export { PLANS };
export type { Plan };
