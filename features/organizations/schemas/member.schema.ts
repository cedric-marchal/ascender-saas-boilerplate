import { z } from "zod";

const ORGANIZATION_MEMBER_ROLES = ["owner", "admin", "member"] as const;
const ORGANIZATION_CHANGEABLE_ROLES = ["admin", "member"] as const;

type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLES)[number];
type OrganizationChangeableRole =
  (typeof ORGANIZATION_CHANGEABLE_ROLES)[number];

const ChangeMemberRoleSchema = z.object({
  memberId: z
    .string()
    .min(1, "L'identifiant du membre est requis")
    .max(255, "L'identifiant est invalide")
    .trim(),
  role: z.enum(ORGANIZATION_CHANGEABLE_ROLES, {
    message: "Le rôle doit être 'admin' ou 'member'",
  }),
});

type ChangeMemberRoleSchemaType = z.infer<typeof ChangeMemberRoleSchema>;

const RemoveMemberSchema = z.object({
  memberId: z
    .string()
    .min(1, "L'identifiant du membre est requis")
    .max(255, "L'identifiant est invalide")
    .trim(),
});

type RemoveMemberSchemaType = z.infer<typeof RemoveMemberSchema>;

const TransferOwnershipSchema = z.object({
  memberId: z
    .string()
    .min(1, "L'identifiant du membre est requis")
    .max(255, "L'identifiant est invalide")
    .trim(),
});

type TransferOwnershipSchemaType = z.infer<typeof TransferOwnershipSchema>;

export {
  ChangeMemberRoleSchema,
  ORGANIZATION_CHANGEABLE_ROLES,
  ORGANIZATION_MEMBER_ROLES,
  RemoveMemberSchema,
  TransferOwnershipSchema,
};
export type {
  ChangeMemberRoleSchemaType,
  OrganizationChangeableRole,
  OrganizationMemberRole,
  RemoveMemberSchemaType,
  TransferOwnershipSchemaType,
};
