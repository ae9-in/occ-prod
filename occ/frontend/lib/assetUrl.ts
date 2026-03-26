import { API_BASE } from "@/lib/api";

const apiOrigin = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();

export function normalizeAssetUrl(value?: string | null, fallback?: string) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return fallback;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("file:")) return fallback;
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) return fallback;

  if (/^https?:\/\//i.test(trimmed)) {
    if (/^https?:\/\/localhost(?::\d+)?\/uploads\//i.test(trimmed) && apiOrigin) {
      const normalizedPath = trimmed.replace(/^https?:\/\/localhost(?::\d+)?/i, "");
      return `${apiOrigin}${normalizedPath}`;
    }
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/^\/+/, "");
  if (normalizedPath.startsWith("uploads/") && apiOrigin) {
    return `${apiOrigin}/${normalizedPath}`;
  }

  return trimmed;
}
