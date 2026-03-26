import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

const configured = !!(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true
  });
}

export const isCloudinaryConfigured = configured;
export { cloudinary };
