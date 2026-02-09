function getInitials(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "";
  }

  const initials = trimmedName
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials;
}

export { getInitials };
