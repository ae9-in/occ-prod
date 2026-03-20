import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { successResponse } from "../utils/response";

const router = Router();

const settingsSchema = z.object({
  themePreference: z.enum(["light", "dark", "system"]).optional(),
  notificationPreferences: z.record(z.boolean()).optional()
});

const privacySchema = z.object({
  profileVisibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  showUniversity: z.boolean().optional(),
  showClubMembership: z.boolean().optional(),
  postVisibilityDefault: z.enum(["PUBLIC", "CLUB", "MEMBERS_ONLY"]).optional()
});

router.get(
  "/settings/me",
  requireAuth,
  asyncHandler(async (req, res) => successResponse(res, "User settings fetched successfully", { settings: req.user?.settings }))
);

router.patch(
  "/settings/me",
  requireAuth,
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const settings = await prisma.userSetting.upsert({
      where: { userId: req.user!.id },
      update: req.body,
      create: {
        userId: req.user!.id,
        themePreference: req.body.themePreference || "system",
        notificationPreferences: req.body.notificationPreferences || {}
      }
    });
    return successResponse(res, "User settings updated successfully", { settings });
  })
);

router.get(
  "/privacy/me",
  requireAuth,
  asyncHandler(async (req, res) => successResponse(res, "Privacy settings fetched successfully", { privacy: req.user?.privacy }))
);

router.patch(
  "/privacy/me",
  requireAuth,
  validate(privacySchema),
  asyncHandler(async (req, res) => {
    const privacy = await prisma.privacySetting.upsert({
      where: { userId: req.user!.id },
      update: req.body,
      create: {
        userId: req.user!.id,
        profileVisibility: req.body.profileVisibility || "PUBLIC",
        showUniversity: req.body.showUniversity ?? true,
        showClubMembership: req.body.showClubMembership ?? true,
        postVisibilityDefault: req.body.postVisibilityDefault || "PUBLIC"
      }
    });
    return successResponse(res, "Privacy settings updated successfully", { privacy });
  })
);

export default router;
