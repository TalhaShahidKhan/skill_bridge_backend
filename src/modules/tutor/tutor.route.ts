import { Router } from "express";
import { UserRole } from "../../lib/constants";
import { requireAuth, requireRole } from "../../middlewares/auth";
import * as tutorController from "./tutor.controller";

const router = Router();

// Profile
router.get(
  "/me",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.getMyProfile,
);
router.put(
  "/me",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.upsertMyProfile,
);
router.patch(
  "/me",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.updateMyProfile,
);

// Availability
router.put(
  "/availability",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.setAvailability,
);

// Sessions (bookings)
router.get(
  "/sessions",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.listMySessions,
);
router.get(
  "/sessions/:id",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.getMySession,
);
router.patch(
  "/sessions/:id/complete",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.markCompleted,
);

// Reviews & dashboard
router.get(
  "/reviews",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.listMyReviews,
);
router.get(
  "/dashboard",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.getDashboardStats,
);

// Categories helper
router.get(
  "/categories",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.listCategories,
);

export const tutorRouter = router;
