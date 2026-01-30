import type { Prisma } from "../../../generated/prisma/client";
import { UserRole, UserStatus } from "../../lib/constants";
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

function buildUserSearchWhere(
  search?: string,
): Prisma.UserWhereInput | undefined {
  const q = search?.trim();
  if (!q) return undefined;

  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ],
  };
}

export type AdminListUsersInput = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
};

export async function listUsers(
  input: AdminListUsersInput = {},
): Promise<{ meta: PageMeta; data: unknown[] }> {
  const { page, limit, skip } = normalizePagination(input);

  const where: Prisma.UserWhereInput = {
    ...(buildUserSearchWhere(input.search) ?? {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(typeof input.emailVerified === "boolean"
      ? { emailVerified: input.emailVerified }
      : {}),
    ...((input.createdFrom || input.createdTo) && {
      createdAt: {
        ...(input.createdFrom ? { gte: input.createdFrom } : {}),
        ...(input.createdTo ? { lte: input.createdTo } : {}),
      },
    }),
  };

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        student: { select: { studentId: true } },
        tutor: { select: { tutorId: true } },
      },
    }),
  ]);

  return { meta: toPageMeta(page, limit, total), data: users as unknown[] };
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      tutor: { include: { category: true } },
      sessions: true,
      accounts: true,
    },
  });
}

export async function setUserRole(userId: string, role: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function setUserStatus(userId: string, status: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
}

export async function suspendUser(userId: string) {
  return setUserStatus(userId, UserStatus.SUSPENDED);
}

export async function activateUser(userId: string) {
  return setUserStatus(userId, UserStatus.ACTIVE);
}

/**
 * Hard delete a user.
 *
 * With your current Prisma relations:
 * - `Student.user` and `Tutor.user` use `onDelete: Cascade`
 * - `Booking.student` / `Booking.tutor` use `onDelete: Cascade`
 * - `Review.student` / `Review.tutor` / `Review.booking` use `onDelete: Cascade`
 *
 * So deleting the `User` will cascade through Student/Tutor → Bookings → Reviews.
 *
 * Note: better-auth has deleteUser enabled, but this service intentionally
 * performs a DB-consistent cleanup regardless of auth API availability.
 */
export async function deleteUserHard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) return null;

  // Sessions & accounts cascade on user delete via `auth.prisma`.
  await prisma.user.delete({ where: { id: userId } });

  return { deletedUserId: userId };
}

// -------------------------
// Moderation (content)
// -------------------------

export type AdminListReviewsInput = {
  page?: number;
  limit?: number;
  tutorId?: string;
  studentId?: string;
  minRating?: number;
  maxRating?: number;
  createdFrom?: Date;
  createdTo?: Date;
};

export async function listReviews(input: AdminListReviewsInput = {}) {
  const { page, limit, skip } = normalizePagination(input);

  const where: Prisma.ReviewWhereInput = {
    ...(input.tutorId ? { tutorId: input.tutorId } : {}),
    ...(input.studentId ? { studentId: input.studentId } : {}),
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
    ...((input.createdFrom || input.createdTo) && {
      createdAt: {
        ...(input.createdFrom ? { gte: input.createdFrom } : {}),
        ...(input.createdTo ? { lte: input.createdTo } : {}),
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
      include: {
        student: { include: { user: true } },
        tutor: { include: { user: true, category: true } },
        booking: true,
      },
    }),
  ]);

  return { meta: toPageMeta(page, limit, total), data: reviews };
}

export async function deleteReview(reviewId: string) {
  return prisma.review.delete({ where: { reviewId } });
}

// -------------------------
// Bookings management
// -------------------------

export type AdminListBookingsInput = {
  page?: number;
  limit?: number;
  status?: string;
  studentId?: string;
  tutorId?: string;
  from?: Date;
  to?: Date;
  search?: string; // searches student/tutor name or email
};

export async function listBookings(input: AdminListBookingsInput = {}) {
  const { page, limit, skip } = normalizePagination(input);

  const where: Prisma.BookingWhereInput = {
    ...(input.status ? { status: input.status as any } : {}),
    ...(input.studentId ? { studentId: input.studentId } : {}),
    ...(input.tutorId ? { tutorId: input.tutorId } : {}),
    ...((input.from || input.to) && {
      date: {
        ...(input.from ? { gte: input.from } : {}),
        ...(input.to ? { lte: input.to } : {}),
      },
    }),
    ...(input.search?.trim()
      ? {
          OR: [
            {
              student: {
                user: {
                  OR: [
                    { name: { contains: input.search, mode: "insensitive" } },
                    { email: { contains: input.search, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              tutor: {
                user: {
                  OR: [
                    { name: { contains: input.search, mode: "insensitive" } },
                    { email: { contains: input.search, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, bookings] = await prisma.$transaction([
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

  return { meta: toPageMeta(page, limit, total), data: bookings };
}

export async function setTutorFeatured(tutorId: string, isFeatured: boolean) {
  return prisma.tutor.update({
    where: { tutorId },
    // prisma client types might lag behind schema changes; keep runtime-safe.
    data: { isFeatured } as unknown as Prisma.TutorUpdateInput,
  });
}

export async function setTutorAvailability(
  tutorId: string,
  input: {
    isAvailable: boolean;
    availableFrom?: Date | null;
    availableTo?: Date | null;
  },
) {
  return prisma.tutor.update({
    where: { tutorId },
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

// Categories moderation (create/update/delete)
export async function createCategory(input: {
  name: string;
  subjects: string[];
}) {
  return prisma.category.create({
    data: { name: input.name, subjects: input.subjects },
  });
}

export async function updateCategory(
  categoryId: string,
  input: { name?: string; subjects?: string[] },
) {
  return prisma.category.update({
    where: { categoryId },
    data: {
      ...(typeof input.name === "string" ? { name: input.name } : {}),
      ...(Array.isArray(input.subjects) ? { subjects: input.subjects } : {}),
    },
  });
}

export async function deleteCategory(categoryId: string) {
  // Prevent deleting a category that still has tutors.
  const tutorCount = await prisma.tutor.count({ where: { categoryId } });
  if (tutorCount > 0) {
    throw httpErrors.conflict(
      "Cannot delete category that is still assigned to tutors.",
      "CATEGORY_IN_USE",
    );
  }
  return prisma.category.delete({ where: { categoryId } });
}

// -------------------------
// Analytics (dashboard)
// -------------------------

export type AdminAnalyticsInput = {
  from?: Date;
  to?: Date;
  topTutorsLimit?: number;
};

export async function getAnalytics(input: AdminAnalyticsInput = {}) {
  const to = input.to ?? new Date();
  const from = input.from ?? new Date(new Date(to).setDate(to.getDate() - 30)); // last 30 days default

  const topLimit = Math.min(20, Math.max(1, input.topTutorsLimit ?? 5));

  const [
    usersTotal,
    studentsTotal,
    tutorsTotal,
    categoriesTotal,
    bookingsTotal,
    reviewsTotal,
    usersByRole,
    usersByStatus,
    bookingsByStatus,
    reviewRatingAgg,
    topTutorAgg,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.student.count(),
    prisma.tutor.count(),
    prisma.category.count(),
    prisma.booking.count(),
    prisma.review.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
      orderBy: { role: "asc" },
    }),
    prisma.user.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({
      by: ["tutorId"],
      _avg: { rating: true },
      _count: { _all: true },
      orderBy: [{ _avg: { rating: "desc" } }, { _count: { reviewId: "desc" } }],
      take: topLimit,
    }),
  ]);

  // Bookings per day (date_trunc) using raw SQL for accurate daily buckets.
  const bookingsPerDay = (await prisma.$queryRaw<
    Array<{ day: Date; count: bigint }>
  >`SELECT date_trunc('day',"date")::date AS day, COUNT(*)::bigint AS count
     FROM "bookings"
     WHERE "date" >= ${from} AND "date" <= ${to}
     GROUP BY day
     ORDER BY day ASC`) as Array<{ day: Date; count: bigint }>;

  const topTutorIds = topTutorAgg.map((t) => t.tutorId);
  const tutorRows = topTutorIds.length
    ? await prisma.tutor.findMany({
        where: { tutorId: { in: topTutorIds } },
        include: { user: true, category: true },
      })
    : [];
  const tutorById = new Map(tutorRows.map((t) => [t.tutorId, t] as const));

  return {
    range: { from, to },
    totals: {
      users: usersTotal,
      students: studentsTotal,
      tutors: tutorsTotal,
      categories: categoriesTotal,
      bookings: bookingsTotal,
      reviews: reviewsTotal,
    },
    users: {
      byRole: usersByRole.map((r) => ({
        role: r.role,
        count: Number(
          (r as unknown as { _count: { _all: number } })._count._all,
        ),
      })),
      byStatus: usersByStatus.map((r) => ({
        status: r.status,
        count: Number(
          (r as unknown as { _count: { _all: number } })._count._all,
        ),
      })),
    },
    bookings: {
      byStatus: bookingsByStatus.map((b) => ({
        status: b.status,
        count: Number(
          (b as unknown as { _count: { _all: number } })._count._all,
        ),
      })),
      perDay: bookingsPerDay.map((r) => ({
        day: r.day,
        count: Number(r.count),
      })),
    },
    reviews: {
      averageRating: reviewRatingAgg._avg.rating ?? 0,
      count: reviewRatingAgg._count._all,
    },
    topTutors: topTutorAgg.map((agg) => {
      const tutor = tutorById.get(agg.tutorId);
      const aggAny = agg as unknown as {
        tutorId: string;
        _avg?: { rating?: number | null };
        _count?: { _all?: number | null };
      };
      return {
        tutorId: aggAny.tutorId,
        avgRating: aggAny._avg?.rating ?? 0,
        reviewsCount: aggAny._count?._all ?? 0,
        tutor: tutor
          ? {
              subject: tutor.subject,
              group: tutor.group,
              pricePerDay: tutor.pricePerDay,
              isFeatured:
                (tutor as unknown as { isFeatured?: boolean }).isFeatured ??
                false,
              isAvailable:
                (tutor as unknown as { isAvailable?: boolean }).isAvailable ??
                true,
              category: tutor.category,
              user: {
                id: tutor.user.id,
                name: tutor.user.name,
                email: tutor.user.email,
                status: tutor.user.status,
                role: tutor.user.role,
              },
            }
          : null,
      };
    }),
  };
}

// Convenience: admin can “grant all permissions” by ensuring role is ADMIN.
export async function ensureAdminRole(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: UserRole.ADMIN },
  });
}
