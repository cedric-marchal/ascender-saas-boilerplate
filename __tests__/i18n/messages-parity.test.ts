import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { describe, expect, it } from "vitest";

type MessageTree = { [key: string]: MessageTree | string | string[] };

/**
 * Recursively collects dot-notation key paths from a message tree. Arrays
 * (e.g. pricing plan features) are treated as leaf values, not recursed
 * into, since their length is allowed to differ in principle but their key
 * path itself must exist on both sides.
 */
function collectKeyPaths(tree: MessageTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value) || typeof value === "string") {
      return [path];
    }

    return collectKeyPaths(value, path);
  });
}

function collectEmptyStringPaths(tree: MessageTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      return value.some((entry: string) => entry.trim() === "") ? [path] : [];
    }

    if (typeof value === "string") {
      return value.trim() === "" ? [path] : [];
    }

    return collectEmptyStringPaths(value, path);
  });
}

describe("messages parity: en.json <-> fr.json", () => {
  const enPaths = collectKeyPaths(en);
  const frPaths = collectKeyPaths(fr);

  it("has no key present in en.json but missing from fr.json", () => {
    const missingInFr = enPaths.filter((path) => !frPaths.includes(path));

    expect(missingInFr).toEqual([]);
  });

  it("has no key present in fr.json but missing from en.json", () => {
    const missingInEn = frPaths.filter((path) => !enPaths.includes(path));

    expect(missingInEn).toEqual([]);
  });

  it("has no empty string value in en.json", () => {
    expect(collectEmptyStringPaths(en)).toEqual([]);
  });

  it("has no empty string value in fr.json", () => {
    expect(collectEmptyStringPaths(fr)).toEqual([]);
  });
});
