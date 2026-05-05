import type { Request, Response } from "express";
import { httpErrors, isHttpError } from "../../utils/httpError";
import * as paymentService from "./payment.service";

type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;

const asyncHandler =
  (fn: AsyncHandler): AsyncHandler =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (isHttpError(err)) {
        return res.status(err.statusCode).json({
          success: false,
          error: { code: err.code, message: err.message },
        });
      }

      console.error("Payment controller error:", err);
      const message =
        err instanceof Error ? err.message : "Internal server error";
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message },
      });
    }
  };

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw httpErrors.unauthorized("Authentication required.");

  const result = await paymentService.createCheckoutSession(userId, req.body);
  res.json({ success: true, data: result });
});

export const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  try {
    const result = await paymentService.handleWebhook(signature, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export const verifySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) throw httpErrors.badRequest("Session ID is required.");

  const result = await paymentService.verifySession(sessionId as string);
  res.json(result);
});

export const getTutorPayments = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw httpErrors.unauthorized("Authentication required.");

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await paymentService.listTutorPayments(userId, page, limit);
  res.json({ success: true, data: result });
});
