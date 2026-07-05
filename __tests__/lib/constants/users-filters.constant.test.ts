import { describe, expect, it } from "vitest";

import {
  isUserRole,
  isUserRoleFilter,
  isVerificationFilter,
  roleLabels,
  userRoleFilters,
  usersSearchParams,
  usersSortableFields,
  verificationFilters,
  verificationLabels,
} from "@/features/users/constants/users-filters.constant";

describe("userRoleFilters", () => {
  it("contains 'all', 'ADMIN', and 'CUSTOMER'", () => {
    expect(userRoleFilters).toEqual(["all", "ADMIN", "CUSTOMER"]);
  });
});

describe("verificationFilters", () => {
  it("contains 'all', 'verified', and 'unverified'", () => {
    expect(verificationFilters).toEqual(["all", "verified", "unverified"]);
  });
});

describe("usersSortableFields", () => {
  it("contains 'name', 'email', and 'createdAt'", () => {
    expect(usersSortableFields).toEqual(["name", "email", "createdAt"]);
  });
});

describe("roleLabels", () => {
  it("maps each role filter to its own translation key", () => {
    expect(roleLabels.all).toBe("all");
    expect(roleLabels.ADMIN).toBe("ADMIN");
    expect(roleLabels.CUSTOMER).toBe("CUSTOMER");
  });

  it("has a label for every role filter", () => {
    for (const filter of userRoleFilters) {
      expect(roleLabels[filter]).toBeDefined();
      expect(typeof roleLabels[filter]).toBe("string");
    }
  });
});

describe("verificationLabels", () => {
  it("maps each verification filter to its own translation key", () => {
    expect(verificationLabels.all).toBe("all");
    expect(verificationLabels.verified).toBe("verified");
    expect(verificationLabels.unverified).toBe("unverified");
  });

  it("has a label for every verification filter", () => {
    for (const filter of verificationFilters) {
      expect(verificationLabels[filter]).toBeDefined();
    }
  });
});

describe("isUserRole", () => {
  it("returns true for ADMIN", () => {
    expect(isUserRole("ADMIN")).toBe(true);
  });

  it("returns true for CUSTOMER", () => {
    expect(isUserRole("CUSTOMER")).toBe(true);
  });

  it("returns false for 'all'", () => {
    expect(isUserRole("all")).toBe(false);
  });

  it("returns false for invalid string", () => {
    expect(isUserRole("MANAGER")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isUserRole("")).toBe(false);
  });
});

describe("isUserRoleFilter", () => {
  it("returns true for 'all'", () => {
    expect(isUserRoleFilter("all")).toBe(true);
  });

  it("returns true for 'ADMIN'", () => {
    expect(isUserRoleFilter("ADMIN")).toBe(true);
  });

  it("returns true for 'CUSTOMER'", () => {
    expect(isUserRoleFilter("CUSTOMER")).toBe(true);
  });

  it("returns false for invalid string", () => {
    expect(isUserRoleFilter("MANAGER")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isUserRoleFilter("")).toBe(false);
  });
});

describe("isVerificationFilter", () => {
  it("returns true for 'all'", () => {
    expect(isVerificationFilter("all")).toBe(true);
  });

  it("returns true for 'verified'", () => {
    expect(isVerificationFilter("verified")).toBe(true);
  });

  it("returns true for 'unverified'", () => {
    expect(isVerificationFilter("unverified")).toBe(true);
  });

  it("returns false for invalid string", () => {
    expect(isVerificationFilter("pending")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isVerificationFilter("")).toBe(false);
  });
});

describe("usersSearchParams", () => {
  it("has all required search params", () => {
    expect(usersSearchParams).toHaveProperty("search");
    expect(usersSearchParams).toHaveProperty("role");
    expect(usersSearchParams).toHaveProperty("verified");
    expect(usersSearchParams).toHaveProperty("sortBy");
    expect(usersSearchParams).toHaveProperty("order");
    expect(usersSearchParams).toHaveProperty("page");
  });
});
