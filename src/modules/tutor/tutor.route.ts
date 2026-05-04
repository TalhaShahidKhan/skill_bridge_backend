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
router.patch(
  "/sessions/:id/meeting-link",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.updateMeetingLink,
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

// Categories helper (Protected for tutor dashboard if needed specific context, or just general)
router.get(
  "/categories",
  requireAuth,
  requireRole(UserRole.TUTOR),
  tutorController.listCategories,
);

export const tutorRouter = router;

// Public Routes
const publicRouter = Router();
publicRouter.get("/", tutorController.listPublicTutors);
publicRouter.get("/:id", tutorController.getPublicTutor);

export const publicTutorRouter = publicRouter;

const catRouter = Router();
catRouter.get("/", tutorController.listCategories);
export const publicCategoriesRouter = catRouter;
