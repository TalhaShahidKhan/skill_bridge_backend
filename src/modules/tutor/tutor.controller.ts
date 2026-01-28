import type { Request, Response } from "express";
import { httpErrors, isHttpError } from "../../utils/httpError";
import * as tutorService from "./tutor.service";

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

      console.error("Tutor controller error:", err);
      const message =
        err instanceof Error ? err.message : "Internal server error";
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message },
      });
    }
  };

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) throw httpErrors.unauthorized("Authentication required.");
  return userId;
}

function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(v: unknown): Date | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  return undefined;
}

function getParam(req: Request, key: string): string | undefined {
  return asString((req.params as unknown as Record<string, unknown>)[key]);
}

// -------------------------
// Profile
// -------------------------

export const getMyProfile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await tutorService.getMyTutorProfile(userId);
  res.json({ success: true, data: profile });
});

export const upsertMyProfile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await tutorService.upsertMyTutorProfile(userId, req.body);
  res.json({ success: true, data: profile });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await tutorService.updateMyTutorProfile(userId, req.body);
  res.json({ success: true, data: profile });
});

// -------------------------
// Availability
// -------------------------

export const setAvailability = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const payload = {
    ...req.body,
    availableFrom: toDate(req.body?.availableFrom) ?? req.body?.availableFrom,
    availableTo: toDate(req.body?.availableTo) ?? req.body?.availableTo,
  };
  const tutor = await tutorService.setMyAvailability(userId, payload);
  res.json({ success: true, data: tutor });
});

// -------------------------
// Sessions
// -------------------------

export const listMySessions = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const status = asString(req.query.status);
  const from = toDate(req.query.from);
  const to = toDate(req.query.to);
  const studentSearch = asString(req.query.studentSearch);

  const result = await tutorService.listMySessions(userId, {
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(status !== undefined ? { status: status as any } : {}),
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(studentSearch !== undefined ? { studentSearch } : {}),
  });
  res.json({ success: true, ...result });
});

export const getMySession = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const bookingId = getParam(req, "id") ?? getParam(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const session = await tutorService.getMySessionById(userId, bookingId);
  res.json({ success: true, data: session });
});

export const markCompleted = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const bookingId = getParam(req, "id") ?? getParam(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const session = await tutorService.markSessionCompleted(userId, bookingId);
  res.json({ success: true, data: session });
});

// -------------------------
// Reviews & dashboard
// -------------------------

export const listMyReviews = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const minRating = toNumber(req.query.minRating);
  const maxRating = toNumber(req.query.maxRating);

  const result = await tutorService.listMyReviews(userId, {
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(minRating !== undefined ? { minRating } : {}),
    ...(maxRating !== undefined ? { maxRating } : {}),
  });
  res.json({ success: true, ...result });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const stats = await tutorService.getMyDashboardStats(userId);
  res.json({ success: true, data: stats });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await tutorService.listCategories();
  res.json({ success: true, data: categories });
});
