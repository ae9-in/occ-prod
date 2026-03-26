const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { v2: cloudinary } = require("cloudinary");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();
const appUrl = (process.env.APP_URL || "http://localhost:5000").replace(/\/+$/, "");
const uploadDir = path.resolve(__dirname, "..", process.env.UPLOAD_DIR || "./uploads");
const dryRun = process.argv.includes("--dry-run");

const credentials = process.env.CLOUDINARY_URL
  ? { cloudinary_url: process.env.CLOUDINARY_URL }
  : (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
        ? {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
          }
        : null
    );

if (!credentials) {
  console.error("Cloudinary is not configured. Set CLOUDINARY_URL or all CLOUDINARY_* values.");
  process.exit(1);
}

cloudinary.config(credentials);

function isCloudinaryUrl(value) {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(value || "");
}

function normalizeToPublicUrl(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) return null;
  return `${appUrl}/${trimmed.replace(/^\/+/, "").replace(/\\/g, "/")}`;
}

function resolveLocalCandidate(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;

  const candidates = [];

  if (/^[a-zA-Z]:[\\/]/.test(trimmed) && fs.existsSync(trimmed)) {
    candidates.push(trimmed);
  }

  const normalizedPath = trimmed.replace(/\\/g, "/");
  if (/^\/?uploads\//i.test(normalizedPath)) {
    candidates.push(path.resolve(__dirname, "..", normalizedPath.replace(/^\/+/, "")));
  }

  try {
    const parsed = new URL(trimmed);
    const filename = path.basename(parsed.pathname);
    if (filename) {
      candidates.push(path.join(uploadDir, filename));
    }
  } catch {}

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

async function uploadPostImageSource(source) {
  const result = await cloudinary.uploader.upload(source, {
    folder: "occ/posts",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });

  return result.secure_url || result.url || null;
}

(async () => {
  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      imageUrl: {
        not: null
      }
    },
    select: {
      id: true,
      imageUrl: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    const currentUrl = post.imageUrl;

    if (!currentUrl || isCloudinaryUrl(currentUrl)) {
      skipped += 1;
      continue;
    }

    const localCandidate = resolveLocalCandidate(currentUrl);
    const source = localCandidate || normalizeToPublicUrl(currentUrl);

    if (!source) {
      failed += 1;
      console.error(`Unable to resolve an upload source for post ${post.id}: ${currentUrl}`);
      continue;
    }

    try {
      const cloudinaryUrl = await uploadPostImageSource(source);
      if (!cloudinaryUrl) {
        throw new Error("Cloudinary did not return a delivery URL.");
      }

      if (!dryRun) {
        await prisma.post.update({
          where: { id: post.id },
          data: { imageUrl: cloudinaryUrl }
        });
      }

      updated += 1;
      console.log(`${dryRun ? "[dry-run] " : ""}Updated post ${post.id} -> ${cloudinaryUrl}`);
    } catch (error) {
      failed += 1;
      console.error(`Failed to migrate post ${post.id}:`, error);
    }
  }

  console.log(JSON.stringify({ updated, skipped, failed, dryRun }, null, 2));
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
