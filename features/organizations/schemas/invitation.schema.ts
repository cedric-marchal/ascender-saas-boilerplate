import { z } from "zod";

const ORGANIZATION_INVITATION_ROLES = ["admin", "member"] as const;

type OrganizationInvitationRole =
  (typeof ORGANIZATION_INVITATION_ROLES)[number];

const InviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(255, "L'email doit contenir moins de 255 caractères")
    .trim()
    .email("L'email est invalide"),
  role: z.enum(ORGANIZATION_INVITATION_ROLES, {
    message: "Le rôle doit être 'admin' ou 'member'",
  }),
});

type InviteMemberSchemaType = z.infer<typeof InviteMemberSchema>;

const AcceptInvitationSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant de l'invitation est requis")
    .max(255, "L'identifiant est invalide")
    .trim(),
});

type AcceptInvitationSchemaType = z.infer<typeof AcceptInvitationSchema>;

export {
  AcceptInvitationSchema,
  InviteMemberSchema,
  ORGANIZATION_INVITATION_ROLES,
};
export type {
  AcceptInvitationSchemaType,
  InviteMemberSchemaType,
  OrganizationInvitationRole,
};
