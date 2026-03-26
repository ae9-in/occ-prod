import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function parseCloudinaryUrl(value: string): CloudinaryCredentials | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "cloudinary:") {
      return null;
    }

    return {
      cloudName: decodeURIComponent(parsed.hostname),
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password),
    };
  } catch {
    return null;
  }
}

const fromUrl = env.cloudinaryUrl ? parseCloudinaryUrl(env.cloudinaryUrl) : null;
const credentials: CloudinaryCredentials | null = fromUrl || (
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
    ? {
        cloudName: env.cloudinaryCloudName,
        apiKey: env.cloudinaryApiKey,
        apiSecret: env.cloudinaryApiSecret,
      }
    : null
);

const configured = !!credentials;

if (credentials) {
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });
}

export const isCloudinaryConfigured = configured;
export { cloudinary };
