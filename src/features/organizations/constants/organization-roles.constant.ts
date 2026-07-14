import { createAccessControl } from "better-auth/plugins/access";

const organizationStatements = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
} as const;

const ac = createAccessControl(organizationStatements);

const ownerRole = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

const adminRole = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

const memberRole = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
});

/**
 * Values are translation KEYS (resolved against the `organizations.roles`
 * message namespace via `useTranslations`), not literal labels.
 */
const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  owner: "owner",
  admin: "admin",
  member: "member",
};

export { ac, adminRole, memberRole, ORGANIZATION_ROLE_LABELS, ownerRole };
