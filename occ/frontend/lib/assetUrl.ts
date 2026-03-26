import { API_BASE } from "@/lib/api";

const apiOrigin = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();

const isUploadPath = (value: string) => /^\/uploads\//i.test(value) || /^uploads\//i.test(value);

export function normalizeAssetUrl(value?: string | null, fallback?: string) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return fallback;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("file:")) return fallback;
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) return fallback;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (isUploadPath(parsed.pathname) && apiOrigin && parsed.origin !== apiOrigin) {
        return `${apiOrigin}${parsed.pathname}${parsed.search}`;
      }
      return trimmed;
    } catch {
      return fallback;
    }
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
  if (isUploadPath(normalizedPath) && apiOrigin) {
    return `${apiOrigin}${normalizedPath}`;
  }

  return trimmed;
}
