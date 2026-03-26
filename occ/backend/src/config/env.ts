import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  UPLOAD_DIR: z.string().default("./uploads"),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("noreply@offcampusclub.com")
});

const parsed = envSchema.parse(process.env);

const looksLikePlaceholderSecret = (value: string) =>
  /^replace-with/i.test(value) || /^changeme/i.test(value) || /^default/i.test(value);

const hasCloudinaryUrl = !!parsed.CLOUDINARY_URL;
const hasManualCloudinaryConfig = !!(
  parsed.CLOUDINARY_CLOUD_NAME &&
  parsed.CLOUDINARY_API_KEY &&
  parsed.CLOUDINARY_API_SECRET
);
const hasPartialManualCloudinaryConfig = !!(
  parsed.CLOUDINARY_CLOUD_NAME ||
  parsed.CLOUDINARY_API_KEY ||
  parsed.CLOUDINARY_API_SECRET
);

if (!hasCloudinaryUrl && hasPartialManualCloudinaryConfig && !hasManualCloudinaryConfig) {
  throw new Error("Cloudinary config is incomplete. Set CLOUDINARY_URL or all CLOUDINARY_* values.");
}

if (parsed.NODE_ENV === "production") {
  if (parsed.JWT_ACCESS_SECRET.length < 32 || parsed.JWT_REFRESH_SECRET.length < 32) {
    throw new Error("JWT secrets must be at least 32 characters long in production");
  }

  if (looksLikePlaceholderSecret(parsed.JWT_ACCESS_SECRET) || looksLikePlaceholderSecret(parsed.JWT_REFRESH_SECRET)) {
    throw new Error("JWT secrets must not use placeholder values in production");
  }

  if (parsed.ADMIN_PASSWORD === "admin123") {
    throw new Error("ADMIN_PASSWORD must be rotated from the default value before production deployment");
  }

  if (!hasCloudinaryUrl && !hasManualCloudinaryConfig) {
    throw new Error("Cloudinary must be configured in production so uploaded images are not stored on local disk.");
  }
}

export const env = {
  port: parsed.PORT,
  nodeEnv: parsed.NODE_ENV,
  databaseUrl: parsed.DATABASE_URL,
  directUrl: parsed.DIRECT_URL,
  jwtAccessSecret: parsed.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: parsed.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
  corsOrigin: parsed.CORS_ORIGIN,
  appUrl: parsed.APP_URL,
  adminEmail: parsed.ADMIN_EMAIL,
  adminPassword: parsed.ADMIN_PASSWORD,
  uploadDir: parsed.UPLOAD_DIR,
  cloudinaryUrl: parsed.CLOUDINARY_URL || "",
  cloudinaryCloudName: parsed.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: parsed.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: parsed.CLOUDINARY_API_SECRET || "",
  smtpHost: parsed.SMTP_HOST,
  smtpPort: parsed.SMTP_PORT,
  smtpUser: parsed.SMTP_USER,
  smtpPass: parsed.SMTP_PASS,
  smtpFrom: parsed.SMTP_FROM
};

export type AppEnv = typeof env;
