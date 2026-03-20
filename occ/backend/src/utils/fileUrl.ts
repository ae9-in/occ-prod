import path from "path";
import { env } from "../config/env";

export function normalizeUrl(filePath?: string | null) {
  if (!filePath) return null;
  if (/^(blob:|file:)/i.test(filePath)) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (/^[a-zA-Z]:[\\/]/.test(filePath)) return null;
  const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${env.appUrl}/${normalized}`;
}

export function fileToRelativeUrl(file?: Express.Multer.File) {
  if (!file) return null;
  const relativePath = path.join("uploads", file.filename).replace(/\\/g, "/");
  return normalizeUrl(relativePath);
}
