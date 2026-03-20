import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "./env";
import { HttpError } from "../lib/httpError";

const uploadDir = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeToExt = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = allowedMimeToExt.get(file.mimetype) || path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 40) || "file";
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExt = path.extname(file.originalname).toLowerCase();
    const expectedExt = allowedMimeToExt.get(file.mimetype);

    if (!expectedExt || !allowedMimeToExt.has(file.mimetype) || (allowedExt && allowedExt !== expectedExt)) {
      cb(new HttpError(400, "Only PNG, JPG, JPEG, WEBP, and GIF uploads are supported"));
      return;
    }
    cb(null, true);
  }
});

export { uploadDir };
