import type { Request, Response } from "express";
import { httpErrors, isHttpError } from "../../utils/httpError";
import * as adminService from "./admin.service";

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

      console.error("Admin controller error:", err);
      const message =
        err instanceof Error ? err.message : "Internal server error";
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message },
      });
    }
  };

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
// Users management
// -------------------------

export const listUsers = asyncHandler(async (req, res) => {
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const search = asString(req.query.search);
  const role = asString(req.query.role);
  const status = asString(req.query.status);
  const emailVerified =
    typeof req.query.emailVerified === "string"
      ? req.query.emailVerified === "true"
      : undefined;
  const createdFrom = toDate(req.query.createdFrom);
  const createdTo = toDate(req.query.createdTo);

  const result = await adminService.listUsers({
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(search !== undefined ? { search } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(emailVerified !== undefined ? { emailVerified } : {}),
    ...(createdFrom !== undefined ? { createdFrom } : {}),
    ...(createdTo !== undefined ? { createdTo } : {}),
  });
  res.json({ success: true, ...result });
});

export const getUser = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const user = await adminService.getUserById(userId);
  res.json({ success: true, data: user });
});

export const setUserRole = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  const role = req.body?.role;
  if (!userId) throw httpErrors.badRequest("userId is required.");
  if (typeof role !== "string")
    throw httpErrors.badRequest("role is required.");
  const user = await adminService.setUserRole(userId, role);
  res.json({ success: true, data: user });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  const status = req.body?.status;
  if (!userId) throw httpErrors.badRequest("userId is required.");
  if (typeof status !== "string")
    throw httpErrors.badRequest("status is required.");
  const user = await adminService.setUserStatus(userId, status);
  res.json({ success: true, data: user });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const user = await adminService.suspendUser(userId);
  res.json({ success: true, data: user });
});

export const activateUser = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const user = await adminService.activateUser(userId);
  res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const result = await adminService.deleteUserHard(userId);
  res.json({ success: true, data: result });
});

// -------------------------
// Analytics
// -------------------------

export const getAnalytics = asyncHandler(async (req, res) => {
  const from = toDate(req.query.from);
  const to = toDate(req.query.to);
  const topTutorsLimit = toNumber(req.query.topTutorsLimit);

  const analytics = await adminService.getAnalytics({
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(topTutorsLimit !== undefined ? { topTutorsLimit } : {}),
  });
  res.json({ success: true, data: analytics });
});

// -------------------------
// Moderation
// -------------------------

export const listReviews = asyncHandler(async (req, res) => {
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const tutorId = asString(req.query.tutorId);
  const studentId = asString(req.query.studentId);
  const minRating = toNumber(req.query.minRating);
  const maxRating = toNumber(req.query.maxRating);
  const createdFrom = toDate(req.query.createdFrom);
  const createdTo = toDate(req.query.createdTo);

  const result = await adminService.listReviews({
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(tutorId !== undefined ? { tutorId } : {}),
    ...(studentId !== undefined ? { studentId } : {}),
    ...(minRating !== undefined ? { minRating } : {}),
    ...(maxRating !== undefined ? { maxRating } : {}),
    ...(createdFrom !== undefined ? { createdFrom } : {}),
    ...(createdTo !== undefined ? { createdTo } : {}),
  });
  res.json({ success: true, ...result });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const reviewId = getParam(req, "id") ?? getParam(req, "reviewId");
  if (!reviewId) throw httpErrors.badRequest("reviewId is required.");
  const review = await adminService.deleteReview(reviewId);
  res.json({ success: true, data: review });
});

export const listBookings = asyncHandler(async (req, res) => {
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const status = asString(req.query.status);
  const studentId = asString(req.query.studentId);
  const tutorId = asString(req.query.tutorId);
  const from = toDate(req.query.from);
  const to = toDate(req.query.to);
  const search = asString(req.query.search);

  const result = await adminService.listBookings({
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(studentId !== undefined ? { studentId } : {}),
    ...(tutorId !== undefined ? { tutorId } : {}),
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(search !== undefined ? { search } : {}),
  });
  res.json({ success: true, ...result });
});

export const setTutorFeatured = asyncHandler(async (req, res) => {
  const tutorId = getParam(req, "id") ?? getParam(req, "tutorId");
  const isFeatured = req.body?.isFeatured;
  if (!tutorId) throw httpErrors.badRequest("tutorId is required.");
  if (typeof isFeatured !== "boolean")
    throw httpErrors.badRequest("isFeatured must be boolean.");
  const tutor = await adminService.setTutorFeatured(tutorId, isFeatured);
  res.json({ success: true, data: tutor });
});

export const setTutorAvailability = asyncHandler(async (req, res) => {
  const tutorId = getParam(req, "id") ?? getParam(req, "tutorId");
  if (!tutorId) throw httpErrors.badRequest("tutorId is required.");
  const tutor = await adminService.setTutorAvailability(tutorId, req.body);
  res.json({ success: true, data: tutor });
});

// -------------------------
// Categories
// -------------------------

export const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const categoryId = getParam(req, "id") ?? getParam(req, "categoryId");
  if (!categoryId) throw httpErrors.badRequest("categoryId is required.");
  const category = await adminService.updateCategory(categoryId, req.body);
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = getParam(req, "id") ?? getParam(req, "categoryId");
  if (!categoryId) throw httpErrors.badRequest("categoryId is required.");
  const category = await adminService.deleteCategory(categoryId);
  res.json({ success: true, data: category });
});
