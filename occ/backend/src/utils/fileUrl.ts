import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";

export function normalizeUrl(filePath?: string | null) {
  if (!filePath) return null;
  if (/^(blob:|file:)/i.test(filePath)) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (/^[a-zA-Z]:[\\/]/.test(filePath)) return null;
  const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${env.appUrl}/${normalized}`;
}

function buildLocalUploadUrl(file?: Express.Multer.File) {
  if (!file) return null;
  const relativePath = path.join("uploads", file.filename).replace(/\\/g, "/");
  return normalizeUrl(relativePath);
}

export function isCloudinaryUrl(value?: string | null) {
  return !!value && /^https?:\/\/res\.cloudinary\.com\//i.test(value);
}

async function uploadSourceToCloudinary(source: string, folder: string) {
  const result = await cloudinary.uploader.upload(source, {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });

  return result.secure_url || result.url || null;
}

export async function fileToPublicUrl(
  file?: Express.Multer.File,
  folder = "occ"
): Promise<string | null> {
  if (!file) return null;

  if (!isCloudinaryConfigured) {
    return buildLocalUploadUrl(file);
  }

  try {
    return await uploadSourceToCloudinary(file.path, folder);
  } finally {
    await fs.unlink(file.path).catch(() => undefined);
  }
}

export async function publicUrlToCloudinary(url: string, folder = "occ") {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  if (isCloudinaryUrl(normalized)) return normalized;
  if (!isCloudinaryConfigured) return normalized;
  return uploadSourceToCloudinary(normalized, folder);
}
