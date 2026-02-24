import { describe, expect, it } from "vitest";

import { UserRole, roleLabels } from "@/lib/constants/roles.constant";

describe("UserRole", () => {
  it("contains ADMIN", () => {
    expect(UserRole.ADMIN).toBe("ADMIN");
  });

  it("contains CUSTOMER", () => {
    expect(UserRole.CUSTOMER).toBe("CUSTOMER");
  });
});

describe("roleLabels", () => {
  it("has an entry for each UserRole", () => {
    const roles = Object.values(UserRole);

    for (const role of roles) {
      expect(roleLabels[role]).toBeDefined();
      expect(typeof roleLabels[role]).toBe("string");
    }
  });

  it("has French labels", () => {
    expect(roleLabels[UserRole.ADMIN]).toBe("Administrateur");
    expect(roleLabels[UserRole.CUSTOMER]).toBe("Client");
  });

  it("has exactly 2 entries", () => {
    const entries = Object.keys(roleLabels);
    expect(entries).toHaveLength(2);
  });

  it("is exhaustive (no missing UserRole)", () => {
    const roleKeys = Object.values(UserRole);
    const labelKeys = Object.keys(roleLabels);

    expect(labelKeys.sort()).toEqual(roleKeys.sort());
  });
});
