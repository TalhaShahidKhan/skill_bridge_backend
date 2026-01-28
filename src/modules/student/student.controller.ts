import type { Request, Response } from "express";
import { httpErrors, isHttpError } from "../../utils/httpError";
import * as studentService from "./student.service";

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

      console.error("Student controller error:", err);
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
  const profile = await studentService.getMyStudentProfile(userId);
  res.json({ success: true, data: profile });
});

export const upsertMyProfile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await studentService.upsertMyStudentProfile(userId, req.body);
  res.json({ success: true, data: profile });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await studentService.updateMyStudentProfile(userId, req.body);
  res.json({ success: true, data: profile });
});

// -------------------------
// Browse tutors / categories
// -------------------------

export const browseTutors = asyncHandler(async (req, res) => {
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const search = asString(req.query.search);
  const categoryId = asString(req.query.categoryId);
  const group = asString(req.query.group);
  const minPricePerDay = toNumber(req.query.minPricePerDay);
  const maxPricePerDay = toNumber(req.query.maxPricePerDay);
  const onlyAvailable =
    typeof req.query.onlyAvailable === "string"
      ? req.query.onlyAvailable === "true"
      : undefined;
  const onlyFeatured =
    typeof req.query.onlyFeatured === "string"
      ? req.query.onlyFeatured === "true"
      : undefined;

  const result = await studentService.browseTutors({
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(search !== undefined ? { search } : {}),
    ...(categoryId !== undefined ? { categoryId } : {}),
    ...(group !== undefined ? { group: group as any } : {}),
    ...(minPricePerDay !== undefined ? { minPricePerDay } : {}),
    ...(maxPricePerDay !== undefined ? { maxPricePerDay } : {}),
    ...(onlyAvailable !== undefined ? { onlyAvailable } : {}),
    ...(onlyFeatured !== undefined ? { onlyFeatured } : {}),
  });
  res.json({ success: true, ...result });
});

export const getTutorDetails = asyncHandler(async (req, res) => {
  const tutorId = getParam(req, "id") ?? getParam(req, "tutorId");
  if (!tutorId) throw httpErrors.badRequest("tutorId is required.");
  const tutor = await studentService.getTutorDetails(tutorId);
  res.json({ success: true, data: tutor });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await studentService.listCategories();
  res.json({ success: true, data: categories });
});

// -------------------------
// Bookings
// -------------------------

export const createBooking = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const payload = {
    ...req.body,
    date: toDate(req.body?.date) ?? req.body?.date,
    time: toDate(req.body?.time) ?? req.body?.time,
  };
  const booking = await studentService.createMyBooking(userId, payload);
  res.status(201).json({ success: true, data: booking });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const status = asString(req.query.status);
  const from = toDate(req.query.from);
  const to = toDate(req.query.to);

  const result = await studentService.listMyBookings(userId, {
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(status !== undefined ? { status: status as any } : {}),
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
  });
  res.json({ success: true, ...result });
});

export const getMyBooking = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const bookingId = getParam(req, "id") ?? getParam(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const booking = await studentService.getMyBookingById(userId, bookingId);
  res.json({ success: true, data: booking });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const bookingId = getParam(req, "id") ?? getParam(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const booking = await studentService.cancelMyBooking(userId, bookingId);
  res.json({ success: true, data: booking });
});

// -------------------------
// Reviews
// -------------------------

export const createReview = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const review = await studentService.createMyReview(userId, req.body);
  res.status(201).json({ success: true, data: review });
});

export const listMyReviews = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const result = await studentService.listMyReviews(userId, {
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {}),
  });
  res.json({ success: true, ...result });
});
