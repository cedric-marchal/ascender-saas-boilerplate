import { z } from "zod";

const ORGANIZATION_INVITATION_ROLES = ["admin", "member"] as const;

type OrganizationInvitationRole =
  (typeof ORGANIZATION_INVITATION_ROLES)[number];

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`.
 */
const InviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "validation.email.required")
    .max(255, "validation.account.emailTooLong")
    .trim()
    .email("validation.email.invalid"),
  role: z.enum(ORGANIZATION_INVITATION_ROLES, {
    message: "validation.organizations.invalidRole",
  }),
});

type InviteMemberSchemaType = z.infer<typeof InviteMemberSchema>;

const AcceptInvitationSchema = z.object({
  id: z
    .string()
    .min(1, "validation.organizations.invitationIdRequired")
    .max(255, "validation.organizations.invitationIdInvalid")
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
