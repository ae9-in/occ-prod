import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { upload } from "../config/upload";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";
import { fileToPublicUrl } from "../utils/fileUrl";
import { HttpError } from "../lib/httpError";

const router = Router();

router.post(
  "/uploads/post-image",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Image file is required");
    return successResponse(res, "Post image uploaded successfully", {
      file: {
        originalName: req.file.originalname,
        url: await fileToPublicUrl(req.file, "occ/posts")
      }
    });
  })
);

router.post(
  "/uploads/club-logo",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Image file is required");
    return successResponse(res, "Club logo uploaded successfully", {
      file: {
        originalName: req.file.originalname,
        url: await fileToPublicUrl(req.file, "occ/clubs/logo")
      }
    });
  })
);

router.post(
  "/uploads/profile-image",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Image file is required");
    return successResponse(res, "Profile image uploaded successfully", {
      file: {
        originalName: req.file.originalname,
        url: await fileToPublicUrl(req.file, "occ/profiles/avatar")
      }
    });
  })
);

export default router;
