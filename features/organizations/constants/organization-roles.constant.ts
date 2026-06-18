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

const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

export { ac, adminRole, memberRole, ORGANIZATION_ROLE_LABELS, ownerRole };
