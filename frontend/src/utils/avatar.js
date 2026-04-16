export function getInitials(name = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "ES";

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}
