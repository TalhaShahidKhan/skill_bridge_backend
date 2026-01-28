import type {
  BookingStatus,
  Group,
  Prisma,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { httpErrors } from "../../utils/httpError";

type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function toPageMeta(page: number, limit: number, total: number): PageMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function normalizePagination(input?: { page?: number; limit?: number }): {
  page: number;
  limit: number;
  skip: number;
} {
  const pageRaw = input?.page ?? 1;
  const limitRaw = input?.limit ?? 20;

  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
    : 20;

  return { page, limit, skip: (page - 1) * limit };
}

// -------------------------
// Student profile
// -------------------------

export async function getMyStudentProfile(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          tutor: { include: { user: true, category: true } },
          review: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          tutor: { include: { user: true, category: true } },
          booking: true,
        },
      },
    },
  });
}

export type UpsertStudentProfileInput = {
  class: string;
  institute: string;
  address: string;
  phone: string;
  profilePic?: string | null;
  bio?: string | null;
  group?: Group;
};

export async function upsertMyStudentProfile(
  userId: string,
  input: UpsertStudentProfileInput,
) {
  return prisma.student.upsert({
    where: { userId },
    create: {
      userId,
      class: input.class,
      institute: input.institute,
      address: input.address,
      phone: input.phone,
      profilePic: input.profilePic ?? null,
      bio: input.bio ?? null,
      group: input.group ?? ("NONE" as Group),
    },
    update: {
      class: input.class,
      institute: input.institute,
      address: input.address,
      phone: input.phone,
      ...(Object.prototype.hasOwnProperty.call(input, "profilePic")
        ? { profilePic: input.profilePic ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "bio")
        ? { bio: input.bio ?? null }
        : {}),
      ...(input.group ? { group: input.group } : {}),
    },
    include: { user: true },
  });
}

export async function updateMyStudentProfile(
  userId: string,
  input: Partial<UpsertStudentProfileInput>,
) {
  // Ensure profile exists (better error semantics than update throwing).
  const existing = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true },
  });
  if (!existing) {
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first.",
    );
  }

  return prisma.student.update({
    where: { userId },
    data: {
      ...(typeof input.class === "string" ? { class: input.class } : {}),
      ...(typeof input.institute === "string"
        ? { institute: input.institute }
        : {}),
      ...(typeof input.address === "string" ? { address: input.address } : {}),
      ...(typeof input.phone === "string" ? { phone: input.phone } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "profilePic")
        ? { profilePic: input.profilePic ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "bio")
        ? { bio: input.bio ?? null }
        : {}),
      ...(input.group ? { group: input.group } : {}),
    },
    include: { user: true },
  });
}

// -------------------------
// Tutor browsing (student-facing)
// -------------------------

export type BrowseTutorsInput = {
  page?: number;
  limit?: number;
  search?: string; // searches tutor.subject + tutor.user.name
  categoryId?: string;
  group?: Group;
  minPricePerDay?: number;
  maxPricePerDay?: number;
  onlyAvailable?: boolean;
  onlyFeatured?: boolean;
};

export async function browseTutors(input: BrowseTutorsInput = {}) {
  const { page, limit, skip } = normalizePagination(input);
  const q = input.search?.trim();

  const where: Prisma.TutorWhereInput = {
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.group ? { group: input.group } : {}),
    ...(typeof input.onlyAvailable === "boolean"
      ? { isAvailable: input.onlyAvailable }
      : {}),
    ...(typeof input.onlyFeatured === "boolean"
      ? { isFeatured: input.onlyFeatured }
      : {}),
    ...((typeof input.minPricePerDay === "number" ||
      typeof input.maxPricePerDay === "number") && {
      pricePerDay: {
        ...(typeof input.minPricePerDay === "number"
          ? { gte: input.minPricePerDay }
          : {}),
        ...(typeof input.maxPricePerDay === "number"
          ? { lte: input.maxPricePerDay }
          : {}),
      },
    }),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, tutors] = await prisma.$transaction([
    prisma.tutor.count({ where }),
    prisma.tutor.findMany({
      where,
      // `isFeatured` might not exist in generated client yet; keep safe ordering.
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
      // Cast to avoid schema/client drift issues during development.
      include: {
        user: true,
        category: true,
        reviews: { select: { rating: true } },
      } as any,
    }),
  ]);

  // Add derived average rating in-memory (simple + sufficient for small payloads).
  const data = tutors.map((t) => {
    const reviews =
      (t as unknown as { reviews?: Array<{ rating: number }> }).reviews ?? [];
    const ratings = reviews.map((r) => r.rating);
    const avgRating = ratings.length
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : 0;
    const { reviews: _ignored, ...rest } = t as any;
    return { ...rest, avgRating, reviewsCount: ratings.length };
  });

  return { meta: toPageMeta(page, limit, total), data };
}

export async function getTutorDetails(tutorId: string) {
  const tutor = await prisma.tutor.findUnique({
    where: { tutorId },
    include: {
      user: true,
      category: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { student: { include: { user: true } }, booking: true },
      },
      bookings: { orderBy: { date: "desc" }, take: 10 },
    } as any,
  });

  if (!tutor) return null;

  const reviews =
    (tutor as unknown as { reviews?: Array<{ rating: number }> }).reviews ?? [];
  const ratings = reviews.map((r) => r.rating);
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  return { ...tutor, avgRating, reviewsCount: ratings.length };
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

// -------------------------
// Bookings (student-owned)
// -------------------------

export type CreateBookingInput = {
  tutorId: string;
  date: Date;
  time: Date;
  duration: number;
  notes?: string | null;
};

export async function createMyBooking(
  userId: string,
  input: CreateBookingInput,
) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true },
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first.",
    );

  // Ensure tutor exists (and optionally available).
  const tutor = await prisma.tutor.findUnique({
    where: { tutorId: input.tutorId },
    select: { tutorId: true, isAvailable: true },
  });
  if (!tutor) throw httpErrors.notFound("Tutor not found.");
  if (!tutor.isAvailable)
    throw httpErrors.conflict("Tutor is not available for booking.");

  return prisma.booking.create({
    data: {
      studentId: student.studentId,
      tutorId: input.tutorId,
      date: input.date,
      time: input.time,
      duration: input.duration,
      notes: input.notes ?? null,
      status: "CONFIRMED",
    },
    include: {
      tutor: { include: { user: true, category: true } },
      review: true,
    },
  });
}

export type ListMyBookingsInput = {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  from?: Date;
  to?: Date;
};

export async function listMyBookings(
  userId: string,
  input: ListMyBookingsInput = {},
) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true },
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first.",
    );

  const { page, limit, skip } = normalizePagination(input);

  const where: Prisma.BookingWhereInput = {
    studentId: student.studentId,
    ...(input.status ? { status: input.status } : {}),
    ...((input.from || input.to) && {
      date: {
        ...(input.from ? { gte: input.from } : {}),
        ...(input.to ? { lte: input.to } : {}),
      },
    }),
  };

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        tutor: { include: { user: true, category: true } },
        review: true,
      },
    }),
  ]);

  return { meta: toPageMeta(page, limit, total), data: bookings };
}

export async function getMyBookingById(userId: string, bookingId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true },
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first.",
    );

  return prisma.booking.findFirst({
    where: { bookingId, studentId: student.studentId },
    include: {
      tutor: { include: { user: true, category: true } },
      student: { include: { user: true } },
      review: true,
    },
  });
}

export async function cancelMyBooking(userId: string, bookingId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true },
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first.",
    );

  const booking = await prisma.booking.findFirst({
    where: { bookingId, studentId: student.studentId },
    select: { bookingId: true, status: true },
  });
  if (!booking) throw httpErrors.notFound("Booking not found.");
  if (booking.status !== "CONFIRMED") {
    throw httpErrors.conflict("Only confirmed bookings can be cancelled.");
  }

  return prisma.booking.update({
    where: { bookingId },
    data: { status: "CANCELLED" },
  });
}

// -------------------------
// Reviews (student-owned)
// -------------------------

export type CreateReviewInput = {
  bookingId: string;
  rating: number;
  comment?: string | null;
};

export async function createMyReview(userId: string, input: CreateReviewInput) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true },
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first.",
    );

  const booking = await prisma.booking.findFirst({
    where: { bookingId: input.bookingId, studentId: student.studentId },
    include: { review: true },
  });
  if (!booking) throw httpErrors.notFound("Booking not found.");
  if (booking.status !== "COMPLETED") {
    throw httpErrors.conflict("You can only review a completed session.");
  }
  if (booking.review) {
    throw httpErrors.conflict("Review already exists for this booking.");
  }

  return prisma.review.create({
    data: {
      bookingId: booking.bookingId,
      studentId: booking.studentId,
      tutorId: booking.tutorId,
      rating: input.rating,
      comment: input.comment ?? null,
    },
    include: {
      tutor: { include: { user: true, category: true } },
      booking: true,
    },
  });
}

export async function listMyReviews(
  userId: string,
  input: { page?: number; limit?: number } = {},
) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true },
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first.",
    );

  const { page, limit, skip } = normalizePagination(input);
  const where: Prisma.ReviewWhereInput = { studentId: student.studentId };

  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        tutor: { include: { user: true, category: true } },
        booking: true,
      },
    }),
  ]);

  return { meta: toPageMeta(page, limit, total), data: reviews };
}
