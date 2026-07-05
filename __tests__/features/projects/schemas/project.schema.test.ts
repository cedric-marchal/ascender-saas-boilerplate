import { describe, expect, it } from "vitest";

import {
  CreateProjectSchema,
  DeleteProjectSchema,
  UpdateProjectSchema,
} from "@/features/projects/schemas/project.schema";

describe("CreateProjectSchema", () => {
  const validData = {
    name: "Refonte du site marketing",
    description: "Un projet de refonte complète.",
    status: "DRAFT",
  };

  it("accepts valid data", () => {
    const result = CreateProjectSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts missing description (optional)", () => {
    const result = CreateProjectSchema.safeParse({
      name: validData.name,
      status: validData.status,
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and description", () => {
    const result = CreateProjectSchema.safeParse({
      ...validData,
      name: "  Projet  ",
      description: "  Description  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Projet");
      expect(result.data.description).toBe("Description");
    }
  });

  describe("name", () => {
    it("rejects empty name", () => {
      const result = CreateProjectSchema.safeParse({
        ...validData,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 200 characters", () => {
      const result = CreateProjectSchema.safeParse({
        ...validData,
        name: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("accepts name at max boundary (200 chars)", () => {
      const result = CreateProjectSchema.safeParse({
        ...validData,
        name: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("description", () => {
    it("rejects description exceeding 2000 characters", () => {
      const result = CreateProjectSchema.safeParse({
        ...validData,
        description: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts description at max boundary (2000 chars)", () => {
      const result = CreateProjectSchema.safeParse({
        ...validData,
        description: "a".repeat(2000),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("status", () => {
    it("rejects invalid status", () => {
      const result = CreateProjectSchema.safeParse({
        ...validData,
        status: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it.each(["DRAFT", "ACTIVE", "ARCHIVED"])(
      "accepts status %s",
      (status: string) => {
        const result = CreateProjectSchema.safeParse({
          ...validData,
          status,
        });
        expect(result.success).toBe(true);
      },
    );
  });
});

describe("UpdateProjectSchema", () => {
  it("accepts partial update with only projectId", () => {
    const result = UpdateProjectSchema.safeParse({
      projectId: "project-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing projectId", () => {
    const result = UpdateProjectSchema.safeParse({
      name: "Nouveau nom",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a full update payload", () => {
    const result = UpdateProjectSchema.safeParse({
      projectId: "project-1",
      name: "Nouveau nom",
      description: "Nouvelle description",
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status on update", () => {
    const result = UpdateProjectSchema.safeParse({
      projectId: "project-1",
      status: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });
});

describe("DeleteProjectSchema", () => {
  it("accepts a valid projectId", () => {
    const result = DeleteProjectSchema.safeParse({ projectId: "project-1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty projectId", () => {
    const result = DeleteProjectSchema.safeParse({ projectId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing projectId", () => {
    const result = DeleteProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
