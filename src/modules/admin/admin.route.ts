import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middlewares/auth";
import * as adminController from "./admin.controller";

const router = Router();

// Users management
router.get("/users", requireAuth, requireAdmin, adminController.listUsers);
router.get("/users/:id", requireAuth, requireAdmin, adminController.getUser);
router.patch(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  adminController.setUserRole,
);
router.patch(
  "/users/:id/status",
  requireAuth,
  requireAdmin,
  adminController.setUserStatus,
);
router.patch(
  "/users/:id/suspend",
  requireAuth,
  requireAdmin,
  adminController.suspendUser,
);
router.patch(
  "/users/:id/activate",
  requireAuth,
  requireAdmin,
  adminController.activateUser,
);
router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  adminController.deleteUser,
);

// Analytics
router.get(
  "/analytics",
  requireAuth,
  requireAdmin,
  adminController.getAnalytics,
);

// Reviews moderation
router.get("/reviews", requireAuth, requireAdmin, adminController.listReviews);
router.delete(
  "/reviews/:id",
  requireAuth,
  requireAdmin,
  adminController.deleteReview,
);

// Bookings management
router.get(
  "/bookings",
  requireAuth,
  requireAdmin,
  adminController.listBookings,
);

// Tutor moderation
router.patch(
  "/tutors/:id/featured",
  requireAuth,
  requireAdmin,
  adminController.setTutorFeatured,
);
router.patch(
  "/tutors/:id/availability",
  requireAuth,
  requireAdmin,
  adminController.setTutorAvailability,
);

// Categories
router.post(
  "/categories",
  requireAuth,
  requireAdmin,
  adminController.createCategory,
);
router.patch(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  adminController.updateCategory,
);
router.delete(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  adminController.deleteCategory,
);

export const adminRouter = router;
