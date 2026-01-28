import { Router } from "express";
import { UserRole } from "../../lib/constants";
import { requireAuth, requireRole } from "../../middlewares/auth";
import * as studentController from "./student.controller";

const router = Router();

// Public-ish helpers (useful for UI). You can move these to a dedicated public router later.
router.get("/tutors", studentController.browseTutors);
router.get("/tutors/:id", studentController.getTutorDetails);
router.get("/categories", studentController.listCategories);

// Profile
router.get(
  "/me",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.getMyProfile,
);
router.put(
  "/me",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.upsertMyProfile,
);
router.patch(
  "/me",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.updateMyProfile,
);

// Bookings
router.post(
  "/bookings",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.createBooking,
);
router.get(
  "/bookings",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.listMyBookings,
);
router.get(
  "/bookings/:id",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.getMyBooking,
);
router.patch(
  "/bookings/:id/cancel",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.cancelBooking,
);

// Reviews
router.post(
  "/reviews",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.createReview,
);
router.get(
  "/reviews",
  requireAuth,
  requireRole(UserRole.STUDENT),
  studentController.listMyReviews,
);

export const studentRouter = router;
