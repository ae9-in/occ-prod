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

export async function fileToPublicUrl(
  file?: Express.Multer.File,
  folder = "occ"
): Promise<string | null> {
  if (!file) return null;

  if (!isCloudinaryConfigured) {
    return buildLocalUploadUrl(file);
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
      overwrite: false
    });

    return result.secure_url || result.url || null;
  } finally {
    await fs.unlink(file.path).catch(() => undefined);
  }
}
