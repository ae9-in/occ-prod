const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    select: { id: true, content: true, imageUrl: true, createdAt: true, moderationStatus: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  console.log(JSON.stringify(posts, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
