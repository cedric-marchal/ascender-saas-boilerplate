import { describe, expect, it } from "vitest";

import {
  parseUserRole,
  USER_ROLE_CONFIG,
} from "@/lib/constants/user-role.constant";

describe("USER_ROLE_CONFIG", () => {
  it("has config for ADMIN role", () => {
    expect(USER_ROLE_CONFIG.ADMIN).toBeDefined();
    expect(USER_ROLE_CONFIG.ADMIN.label).toBe("Administrateur");
    expect(USER_ROLE_CONFIG.ADMIN.color).toBe("indigo");
  });

  it("has config for CUSTOMER role", () => {
    expect(USER_ROLE_CONFIG.CUSTOMER).toBeDefined();
    expect(USER_ROLE_CONFIG.CUSTOMER.label).toBe("Client");
    expect(USER_ROLE_CONFIG.CUSTOMER.color).toBe("blue");
  });

  it("has exactly 2 roles", () => {
    expect(Object.keys(USER_ROLE_CONFIG)).toHaveLength(2);
  });

  it("each role has label and color", () => {
    for (const config of Object.values(USER_ROLE_CONFIG)) {
      expect(config.label).toBeDefined();
      expect(typeof config.label).toBe("string");
      expect(config.color).toBeDefined();
      expect(typeof config.color).toBe("string");
    }
  });
});

describe("parseUserRole", () => {
  it("returns ADMIN for 'ADMIN'", () => {
    expect(parseUserRole("ADMIN")).toBe("ADMIN");
  });

  it("returns CUSTOMER for 'CUSTOMER'", () => {
    expect(parseUserRole("CUSTOMER")).toBe("CUSTOMER");
  });

  it("throws for invalid role", () => {
    expect(() => parseUserRole("MANAGER")).toThrow(
      "Role invalide dans la session: MANAGER"
    );
  });

  it("throws for empty string", () => {
    expect(() => parseUserRole("")).toThrow(
      "Role invalide dans la session: "
    );
  });

  it("throws for lowercase role", () => {
    expect(() => parseUserRole("admin")).toThrow(
      "Role invalide dans la session: admin"
    );
  });
});
