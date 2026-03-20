import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { env } from "../src/config/env";

const prisma = new PrismaClient();

async function main() {
  await prisma.adminActionLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.share.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.clubJoinRequest.deleteMany();
  await prisma.clubMember.deleteMany();
  await prisma.club.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.privacySetting.deleteMany();
  await prisma.userSetting.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash(env.adminPassword, 10);

  await prisma.user.create({
    data: {
      email: env.adminEmail,
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isActive: true,
      profile: {
        create: {
          displayName: "OCC Admin",
          bio: "Platform administrator for OCC.",
        },
      },
      settings: {
        create: {
          themePreference: "system",
          notificationPreferences: {
            email: true,
            push: true,
            product: false,
          },
        },
      },
      privacy: {
        create: {
          profileVisibility: "PUBLIC",
          showUniversity: true,
          showClubMembership: true,
          postVisibilityDefault: "PUBLIC",
        },
      },
    },
  });
}

main()
  .then(() => {
    console.log("Seed completed successfully with admin-only data");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
