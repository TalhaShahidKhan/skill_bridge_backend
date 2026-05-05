import express, { Router } from "express";
import { UserRole } from "../../lib/constants";
import { requireAuth, requireRole } from "../../middlewares/auth";
import * as paymentController from "./payment.controller";

const router = Router();

// Webhook needs raw body, usually handled in server.ts but let's define route here
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook,
);

router.post(
  "/create-checkout-session",
  requireAuth,
  requireRole(UserRole.STUDENT),
  paymentController.createCheckoutSession,
);

router.post(
  "/verify-session/:sessionId",
  requireAuth,
  requireRole(UserRole.STUDENT),
  paymentController.verifySession,
);

router.get(
  "/tutor-payments",
  requireAuth,
  requireRole(UserRole.TUTOR),
  paymentController.getTutorPayments,
);

export const paymentRouter = router;
