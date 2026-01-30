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
// Tutor profile
// -------------------------

export async function getMyTutorProfile(userId: string) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    include: {
      user: true,
      category: true,
      bookings: {
        orderBy: { date: "desc" },
        take: 5,
        include: { student: { include: { user: true } }, review: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { student: { include: { user: true } }, booking: true },
      },
    },
  });

  if (!tutor) return null;

  const reviews =
    (tutor as unknown as { reviews?: Array<{ rating: number }> }).reviews ?? [];
  const ratings = reviews.map((r) => r.rating);
  const avgRating = ratings.length
    ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
    : 0;

  return { ...tutor, avgRating, reviewsCount: ratings.length };
}

export type UpsertTutorProfileInput = {
  subject: string;
  experience: number;
  address: string;
  phone: string;
  profilePic?: string | null;
  bio?: string | null;
  institute?: string | null;
  group: Group;
  categoryId: string;
  pricePerDay: number;
};

export async function upsertMyTutorProfile(
  userId: string,
  input: UpsertTutorProfileInput,
) {
  // Validate category existence
  const category = await prisma.category.findUnique({
    where: { categoryId: input.categoryId },
    select: { categoryId: true },
  });
  if (!category) {
    throw httpErrors.notFound("Category not found.", "INVALID_CATEGORY");
  }

  return prisma.tutor.upsert({
    where: { userId },
    create: {
      userId,
      subject: input.subject,
      experience: input.experience,
      address: input.address,
      phone: input.phone,
      profilePic: input.profilePic ?? null,
      bio: input.bio ?? null,
      institute: input.institute ?? null,
      group: input.group,
      categoryId: input.categoryId,
      pricePerDay: input.pricePerDay,
      isAvailable: true,
    },
    update: {
      subject: input.subject,
      experience: input.experience,
      address: input.address,
      phone: input.phone,
      ...(Object.prototype.hasOwnProperty.call(input, "profilePic")
        ? { profilePic: input.profilePic ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "bio")
        ? { bio: input.bio ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "institute")
        ? { institute: input.institute ?? null }
        : {}),
      group: input.group,
      categoryId: input.categoryId,
      pricePerDay: input.pricePerDay,
    },
    include: { user: true, category: true },
  });
}

export async function updateMyTutorProfile(
  userId: string,
  input: Partial<UpsertTutorProfileInput>,
) {
  const existing = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!existing) {
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first.",
    );
  }

  if (typeof input.categoryId === "string") {
    const category = await prisma.category.findUnique({
      where: { categoryId: input.categoryId },
      select: { categoryId: true },
    });
    if (!category) {
      throw httpErrors.notFound("Category not found.", "INVALID_CATEGORY");
    }
  }

  return prisma.tutor.update({
    where: { userId },
    data: {
      ...(typeof input.subject === "string" ? { subject: input.subject } : {}),
      ...(typeof input.experience === "number"
        ? { experience: input.experience }
        : {}),
      ...(typeof input.address === "string" ? { address: input.address } : {}),
      ...(typeof input.phone === "string" ? { phone: input.phone } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "profilePic")
        ? { profilePic: input.profilePic ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "bio")
        ? { bio: input.bio ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "institute")
        ? { institute: input.institute ?? null }
        : {}),
      ...(input.group ? { group: input.group } : {}),
      ...(typeof input.categoryId === "string"
        ? { categoryId: input.categoryId }
        : {}),
      ...(typeof input.pricePerDay === "number"
        ? { pricePerDay: input.pricePerDay }
        : {}),
    },
    include: { user: true, category: true },
  });
}

// -------------------------
// Availability
// -------------------------

export type SetAvailabilityInput = {
  isAvailable: boolean;
  availableFrom?: Date | null;
  availableTo?: Date | null;
};

export async function setMyAvailability(
  userId: string,
  input: SetAvailabilityInput,
) {
  const existing = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!existing)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first.",
    );

  return prisma.tutor.update({
    where: { userId },
    data: {
      isAvailable: input.isAvailable,
      ...(Object.prototype.hasOwnProperty.call(input, "availableFrom")
        ? { availableFrom: input.availableFrom ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "availableTo")
        ? { availableTo: input.availableTo ?? null }
        : {}),
    } as unknown as Prisma.TutorUpdateInput,
  });
}

// -------------------------
// Bookings / sessions (tutor-owned)
// -------------------------

export type ListMySessionsInput = {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  from?: Date;
  to?: Date;
  studentSearch?: string; // searches student user name/email
};

export async function listMySessions(
  userId: string,
  input: ListMySessionsInput = {},
) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first.",
    );

  const { page, limit, skip } = normalizePagination(input);
  const q = input.studentSearch?.trim();

  const where: Prisma.BookingWhereInput = {
    tutorId: tutor.tutorId,
    ...(input.status ? { status: input.status } : {}),
    ...((input.from || input.to) && {
      date: {
        ...(input.from ? { gte: input.from } : {}),
        ...(input.to ? { lte: input.to } : {}),
      },
    }),
    ...(q
      ? {
          student: {
            user: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        }
      : {}),
  };

  const [total, sessions] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        student: { include: { user: true } },
        tutor: { include: { user: true, category: true } },
        review: true,
      },
    }),
  ]);

  return { meta: toPageMeta(page, limit, total), data: sessions };
}

export async function getMySessionById(userId: string, bookingId: string) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first.",
    );

  return prisma.booking.findFirst({
    where: { bookingId, tutorId: tutor.tutorId },
    include: {
      student: { include: { user: true } },
      tutor: { include: { user: true, category: true } },
      review: true,
    },
  });
}

export async function markSessionCompleted(userId: string, bookingId: string) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first.",
    );

  const booking = await prisma.booking.findFirst({
    where: { bookingId, tutorId: tutor.tutorId },
    select: { bookingId: true, status: true },
  });
  if (!booking) throw httpErrors.notFound("Booking not found.");
  if (booking.status !== "CONFIRMED") {
    throw httpErrors.conflict(
      "Only confirmed sessions can be marked completed.",
    );
  }

  return prisma.booking.update({
    where: { bookingId },
    data: { status: "COMPLETED" },
  });
}

// -------------------------
// Reviews / ratings (tutor-owned)
// -------------------------

export async function listMyReviews(
  userId: string,
  input: {
    page?: number;
    limit?: number;
    minRating?: number;
    maxRating?: number;
  } = {},
) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first.",
    );

  const { page, limit, skip } = normalizePagination(input);

  const where: Prisma.ReviewWhereInput = {
    tutorId: tutor.tutorId,
    ...((typeof input.minRating === "number" ||
      typeof input.maxRating === "number") && {
      rating: {
        ...(typeof input.minRating === "number"
          ? { gte: input.minRating }
          : {}),
        ...(typeof input.maxRating === "number"
          ? { lte: input.maxRating }
          : {}),
      },
    }),
  };

  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { student: { include: { user: true } }, booking: true },
    }),
  ]);

  return { meta: toPageMeta(page, limit, total), data: reviews };
}

export async function getMyDashboardStats(userId: string) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first.",
    );

  const [
    totalSessions,
    confirmedSessions,
    completedSessions,
    cancelledSessions,
    ratingAgg,
  ] = await prisma.$transaction([
    prisma.booking.count({ where: { tutorId: tutor.tutorId } }),
    prisma.booking.count({
      where: { tutorId: tutor.tutorId, status: "CONFIRMED" },
    }),
    prisma.booking.count({
      where: { tutorId: tutor.tutorId, status: "COMPLETED" },
    }),
    prisma.booking.count({
      where: { tutorId: tutor.tutorId, status: "CANCELLED" },
    }),
    prisma.review.aggregate({
      where: { tutorId: tutor.tutorId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return {
    sessions: {
      total: totalSessions,
      confirmed: confirmedSessions,
      completed: completedSessions,
      cancelled: cancelledSessions,
    },
    reviews: {
      averageRating: ratingAgg._avg.rating ?? 0,
      count: ratingAgg._count._all,
    },
  };
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
