// src/index.ts
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/utils/sendMail.ts
import "dotenv/config";
import nodemailer from "nodemailer";
var EmailError = class extends Error {
  constructor(message, originalError) {
    super(message);
    this.originalError = originalError;
    this.name = "EmailError";
  }
};
var validateEmailConfig = () => {
  if (!process.env.EMAIL_HOST_USER) {
    throw new EmailError("EMAIL_HOST_USER environment variable is not set");
  }
  if (!process.env.EMAIL_HOST_PASSWORD) {
    throw new EmailError("EMAIL_HOST_PASSWORD environment variable is not set");
  }
};
var createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    // Use true for port 465, false for port 587
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD
    }
  });
};
var sendMail = async (mailOptions) => {
  try {
    validateEmailConfig();
    if (!mailOptions.to) {
      throw new EmailError("Recipient email address (to) is required");
    }
    if (!mailOptions.subject) {
      throw new EmailError("Email subject is required");
    }
    if (!mailOptions.text && !mailOptions.html) {
      throw new EmailError("Email body (text or html) is required");
    }
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully to ${mailOptions.to}. MessageId: ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send email to ${mailOptions.to}: ${errorMessage}`);
    if (error instanceof EmailError) {
      throw error;
    }
    throw new EmailError(`Failed to send email: ${errorMessage}`, error);
  }
};

// src/lib/constants.ts
var UserRole = {
  STUDENT: "STUDENT",
  TUTOR: "TUTOR",
  ADMIN: "ADMIN"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED"
};

// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": 'model User {\n  id            String    @id\n  name          String\n  email         String\n  emailVerified Boolean   @default(false)\n  image         String?\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n  sessions      Session[]\n  accounts      Account[]\n\n  role    String   @default("STUDENT")\n  status  String   @default("ACTIVE")\n  student Student?\n  tutor   Tutor?\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nenum BookingStatus {\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nmodel Booking {\n  bookingId String        @id @default(uuid())\n  studentId String\n  student   Student       @relation(fields: [studentId], references: [studentId], onDelete: Cascade)\n  tutorId   String\n  tutor     Tutor         @relation(fields: [tutorId], references: [tutorId], onDelete: Cascade)\n  date      DateTime\n  time      DateTime\n  duration  Int\n  status    BookingStatus @default(CONFIRMED)\n  notes     String?\n  createdAt DateTime      @default(now())\n  updatedAt DateTime      @updatedAt\n  review    Review?\n\n  @@index([date])\n  @@index([status])\n  @@index([studentId])\n  @@index([tutorId])\n  @@map("bookings")\n}\n\nmodel Category {\n  categoryId String   @id @default(uuid())\n  name       String\n  subjects   String[]\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n  tutors     Tutor[]\n\n  @@unique([name])\n  @@map("categories")\n}\n\nmodel Review {\n  reviewId  String   @id @default(uuid())\n  studentId String\n  student   Student  @relation(fields: [studentId], references: [studentId], onDelete: Cascade)\n  tutorId   String\n  tutor     Tutor    @relation(fields: [tutorId], references: [tutorId], onDelete: Cascade)\n  bookingId String   @unique\n  booking   Booking  @relation(fields: [bookingId], references: [bookingId], onDelete: Cascade)\n  rating    Int\n  comment   String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([tutorId])\n  @@index([rating])\n  @@map("reviews")\n}\n\n// This is your Prisma schema file,\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Student {\n  studentId  String    @id @default(uuid())\n  class      String\n  institute  String\n  address    String\n  phone      String\n  profilePic String?\n  bio        String?\n  group      Group     @default(NONE)\n  createdAt  DateTime  @default(now())\n  updatedAt  DateTime  @updatedAt\n  userId     String    @unique\n  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  bookings   Booking[]\n  reviews    Review[]\n\n  @@map("students")\n}\n\nenum Group {\n  NONE\n  SCIENCE\n  HUMANITIES\n  BUSINESS_STUDIES\n}\n\nmodel Tutor {\n  tutorId       String    @id @default(uuid())\n  subject       String\n  experience    Int\n  address       String\n  phone         String\n  profilePic    String?\n  bio           String?\n  institute     String?\n  group         Group\n  isFeatured    Boolean   @default(false)\n  isAvailable   Boolean   @default(true)\n  availableFrom DateTime?\n  availableTo   DateTime?\n  pricePerDay   Float\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n  userId        String    @unique\n  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  categoryId    String\n  category      Category  @relation(fields: [categoryId], references: [categoryId], onDelete: Cascade)\n  bookings      Booking[]\n  reviews       Review[]\n\n  @@map("tutors")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"role","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"Student","relationName":"StudentToUser"},{"name":"tutor","kind":"object","type":"Tutor","relationName":"TutorToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Booking":{"fields":[{"name":"bookingId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"Student","relationName":"BookingToStudent"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"Tutor","relationName":"BookingToTutor"},{"name":"date","kind":"scalar","type":"DateTime"},{"name":"time","kind":"scalar","type":"DateTime"},{"name":"duration","kind":"scalar","type":"Int"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"}],"dbName":"bookings"},"Category":{"fields":[{"name":"categoryId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"subjects","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"tutors","kind":"object","type":"Tutor","relationName":"CategoryToTutor"}],"dbName":"categories"},"Review":{"fields":[{"name":"reviewId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"Student","relationName":"ReviewToStudent"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"Tutor","relationName":"ReviewToTutor"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"reviews"},"Student":{"fields":[{"name":"studentId","kind":"scalar","type":"String"},{"name":"class","kind":"scalar","type":"String"},{"name":"institute","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"profilePic","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"group","kind":"enum","type":"Group"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"StudentToUser"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToStudent"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToStudent"}],"dbName":"students"},"Tutor":{"fields":[{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subject","kind":"scalar","type":"String"},{"name":"experience","kind":"scalar","type":"Int"},{"name":"address","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"profilePic","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"institute","kind":"scalar","type":"String"},{"name":"group","kind":"enum","type":"Group"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"isAvailable","kind":"scalar","type":"Boolean"},{"name":"availableFrom","kind":"scalar","type":"DateTime"},{"name":"availableTo","kind":"scalar","type":"DateTime"},{"name":"pricePerDay","kind":"scalar","type":"Float"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"TutorToUser"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToTutor"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutor"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutor"}],"dbName":"tutors"}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer } = await import("buffer");
  const wasmArray = Buffer.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.js"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.js");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("DATABASE_URL is not defined.");
}
var pool = new Pool({ connectionString: connectionString || "" });
var adapter = new PrismaPg(pool);
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
if (!process.env.APP_URL) {
  console.warn("APP_URL is not defined. Authentication might fail.");
}
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  trustedOrigins: [process.env.APP_URL || "http://localhost:3000"],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.STUDENT
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE
      }
    },
    deleteUser: {
      enabled: true
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Password Reset Request",
          text: `Click here to reset your password: ${url}`
        };
        await sendMail(mailOptions);
      } catch (error) {
        console.error(
          `Failed to send password reset email to ${user.email}:`,
          error
        );
      }
    },
    onPasswordReset: async ({ user }, request) => {
      try {
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Password Reset Successful",
          text: "Your password has been reset successfully."
        };
        await sendMail(mailOptions);
      } catch (error) {
        console.error(
          `Failed to send password reset confirmation to ${user.email}:`,
          error
        );
      }
    }
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Verify your email address",
          text: `Please click on the following link to verify your email address: ${url}`
        };
        await sendMail(mailOptions);
      } catch (error) {
        console.error(
          `Failed to send verification email to ${user.email}:`,
          error
        );
        throw error;
      }
    }
  }
});

// src/modules/admin/admin.route.ts
import { Router } from "express";

// src/middlewares/auth.ts
import { fromNodeHeaders } from "better-auth/node";
var checkUserStatus = (user) => {
  if (user.status === UserStatus.SUSPENDED) {
    return {
      status: 403,
      error: {
        code: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended."
      }
    };
  }
  if (user.status === UserStatus.INACTIVE) {
    return {
      status: 403,
      error: {
        code: "ACCOUNT_INACTIVE",
        message: "Your account is inactive."
      }
    };
  }
  return null;
};
var requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log in."
        }
      });
    }
    const user = session.user;
    const statusError = checkUserStatus(user);
    if (statusError) {
      return res.status(statusError.status).json({
        success: false,
        error: statusError.error
      });
    }
    req.user = user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Internal server error during authentication."
      }
    });
  }
};
var requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers)
        });
        if (!session?.user) {
          return res.status(401).json({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required. Please log in."
            }
          });
        }
        req.user = session.user;
        req.session = session.session;
      } catch (e) {
        console.error("Role middleware auth check error:", e);
        return res.status(500).json({
          success: false,
          error: { code: "SERVER_ERROR", message: "Error checking role" }
        });
      }
    }
    const statusError = checkUserStatus(req.user);
    if (statusError) {
      return res.status(statusError.status).json({
        success: false,
        error: statusError.error
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions."
        }
      });
    }
    next();
  };
};
var requireAdmin = requireRole(UserRole.ADMIN);

// src/utils/httpError.ts
var HttpError = class extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
};
function isHttpError(err) {
  return typeof err === "object" && err !== null && "statusCode" in err && "code" in err && typeof err.statusCode === "number" && typeof err.code === "string";
}
var httpErrors = {
  badRequest(message, code = "BAD_REQUEST") {
    return new HttpError(400, code, message);
  },
  unauthorized(message = "Authentication required.", code = "UNAUTHORIZED") {
    return new HttpError(401, code, message);
  },
  forbidden(message = "Insufficient permissions.", code = "FORBIDDEN") {
    return new HttpError(403, code, message);
  },
  notFound(message, code = "NOT_FOUND") {
    return new HttpError(404, code, message);
  },
  conflict(message, code = "CONFLICT") {
    return new HttpError(409, code, message);
  }
};

// src/modules/admin/admin.service.ts
function toPageMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}
function normalizePagination(input) {
  const pageRaw = input?.page ?? 1;
  const limitRaw = input?.limit ?? 20;
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 20;
  return { page, limit, skip: (page - 1) * limit };
}
function buildUserSearchWhere(search) {
  const q = search?.trim();
  if (!q) return void 0;
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } }
    ]
  };
}
async function listUsers(input = {}) {
  const { page, limit, skip } = normalizePagination(input);
  const where = {
    ...buildUserSearchWhere(input.search) ?? {},
    ...input.role ? { role: input.role } : {},
    ...input.status ? { status: input.status } : {},
    ...typeof input.emailVerified === "boolean" ? { emailVerified: input.emailVerified } : {},
    ...(input.createdFrom || input.createdTo) && {
      createdAt: {
        ...input.createdFrom ? { gte: input.createdFrom } : {},
        ...input.createdTo ? { lte: input.createdTo } : {}
      }
    }
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
        tutor: { select: { tutorId: true } }
      }
    })
  ]);
  return { meta: toPageMeta(page, limit, total), data: users };
}
async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      tutor: { include: { category: true } },
      sessions: true,
      accounts: true
    }
  });
}
async function setUserRole(userId, role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role }
  });
}
async function setUserStatus(userId, status) {
  return prisma.user.update({
    where: { id: userId },
    data: { status }
  });
}
async function suspendUser(userId) {
  return setUserStatus(userId, UserStatus.SUSPENDED);
}
async function activateUser(userId) {
  return setUserStatus(userId, UserStatus.ACTIVE);
}
async function deleteUserHard(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) return null;
  await prisma.user.delete({ where: { id: userId } });
  return { deletedUserId: userId };
}
async function listReviews(input = {}) {
  const { page, limit, skip } = normalizePagination(input);
  const where = {
    ...input.tutorId ? { tutorId: input.tutorId } : {},
    ...input.studentId ? { studentId: input.studentId } : {},
    ...(typeof input.minRating === "number" || typeof input.maxRating === "number") && {
      rating: {
        ...typeof input.minRating === "number" ? { gte: input.minRating } : {},
        ...typeof input.maxRating === "number" ? { lte: input.maxRating } : {}
      }
    },
    ...(input.createdFrom || input.createdTo) && {
      createdAt: {
        ...input.createdFrom ? { gte: input.createdFrom } : {},
        ...input.createdTo ? { lte: input.createdTo } : {}
      }
    }
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
        booking: true
      }
    })
  ]);
  return { meta: toPageMeta(page, limit, total), data: reviews };
}
async function deleteReview(reviewId) {
  return prisma.review.delete({ where: { reviewId } });
}
async function listBookings(input = {}) {
  const { page, limit, skip } = normalizePagination(input);
  const where = {
    ...input.status ? { status: input.status } : {},
    ...input.studentId ? { studentId: input.studentId } : {},
    ...input.tutorId ? { tutorId: input.tutorId } : {},
    ...(input.from || input.to) && {
      date: {
        ...input.from ? { gte: input.from } : {},
        ...input.to ? { lte: input.to } : {}
      }
    },
    ...input.search?.trim() ? {
      OR: [
        {
          student: {
            user: {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } }
              ]
            }
          }
        },
        {
          tutor: {
            user: {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } }
              ]
            }
          }
        }
      ]
    } : {}
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
        review: true
      }
    })
  ]);
  return { meta: toPageMeta(page, limit, total), data: bookings };
}
async function setTutorFeatured(tutorId, isFeatured) {
  return prisma.tutor.update({
    where: { tutorId },
    // prisma client types might lag behind schema changes; keep runtime-safe.
    data: { isFeatured }
  });
}
async function setTutorAvailability(tutorId, input) {
  return prisma.tutor.update({
    where: { tutorId },
    data: {
      isAvailable: input.isAvailable,
      ...Object.prototype.hasOwnProperty.call(input, "availableFrom") ? { availableFrom: input.availableFrom ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "availableTo") ? { availableTo: input.availableTo ?? null } : {}
    }
  });
}
async function createCategory(input) {
  return prisma.category.create({
    data: { name: input.name, subjects: input.subjects }
  });
}
async function updateCategory(categoryId, input) {
  return prisma.category.update({
    where: { categoryId },
    data: {
      ...typeof input.name === "string" ? { name: input.name } : {},
      ...Array.isArray(input.subjects) ? { subjects: input.subjects } : {}
    }
  });
}
async function deleteCategory(categoryId) {
  const tutorCount = await prisma.tutor.count({ where: { categoryId } });
  if (tutorCount > 0) {
    throw httpErrors.conflict(
      "Cannot delete category that is still assigned to tutors.",
      "CATEGORY_IN_USE"
    );
  }
  return prisma.category.delete({ where: { categoryId } });
}
async function getAnalytics(input = {}) {
  const to = input.to ?? /* @__PURE__ */ new Date();
  const from = input.from ?? new Date(new Date(to).setDate(to.getDate() - 30));
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
    topTutorAgg
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
      orderBy: { role: "asc" }
    }),
    prisma.user.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" }
    }),
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" }
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({
      by: ["tutorId"],
      _avg: { rating: true },
      _count: { _all: true },
      orderBy: [{ _avg: { rating: "desc" } }, { _count: { reviewId: "desc" } }],
      take: topLimit
    })
  ]);
  const bookingsPerDay = await prisma.$queryRaw`SELECT date_trunc('day',"date")::date AS day, COUNT(*)::bigint AS count
     FROM "bookings"
     WHERE "date" >= ${from} AND "date" <= ${to}
     GROUP BY day
     ORDER BY day ASC`;
  const topTutorIds = topTutorAgg.map((t) => t.tutorId);
  const tutorRows = topTutorIds.length ? await prisma.tutor.findMany({
    where: { tutorId: { in: topTutorIds } },
    include: { user: true, category: true }
  }) : [];
  const tutorById = new Map(tutorRows.map((t) => [t.tutorId, t]));
  return {
    range: { from, to },
    totals: {
      users: usersTotal,
      students: studentsTotal,
      tutors: tutorsTotal,
      categories: categoriesTotal,
      bookings: bookingsTotal,
      reviews: reviewsTotal
    },
    users: {
      byRole: usersByRole.map((r) => ({
        role: r.role,
        count: Number(
          r._count._all
        )
      })),
      byStatus: usersByStatus.map((r) => ({
        status: r.status,
        count: Number(
          r._count._all
        )
      }))
    },
    bookings: {
      byStatus: bookingsByStatus.map((b) => ({
        status: b.status,
        count: Number(
          b._count._all
        )
      })),
      perDay: bookingsPerDay.map((r) => ({
        day: r.day,
        count: Number(r.count)
      }))
    },
    reviews: {
      averageRating: reviewRatingAgg._avg.rating ?? 0,
      count: reviewRatingAgg._count._all
    },
    topTutors: topTutorAgg.map((agg) => {
      const tutor = tutorById.get(agg.tutorId);
      const aggAny = agg;
      return {
        tutorId: aggAny.tutorId,
        avgRating: aggAny._avg?.rating ?? 0,
        reviewsCount: aggAny._count?._all ?? 0,
        tutor: tutor ? {
          subject: tutor.subject,
          group: tutor.group,
          pricePerDay: tutor.pricePerDay,
          isFeatured: tutor.isFeatured ?? false,
          isAvailable: tutor.isAvailable ?? true,
          category: tutor.category,
          user: {
            id: tutor.user.id,
            name: tutor.user.name,
            email: tutor.user.email,
            status: tutor.user.status,
            role: tutor.user.role
          }
        } : null
      };
    })
  };
}

// src/modules/admin/admin.controller.ts
var asyncHandler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (isHttpError(err)) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }
    console.error("Admin controller error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message }
    });
  }
};
function toNumber(v) {
  if (v === void 0 || v === null || v === "") return void 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : void 0;
}
function toDate(v) {
  if (v === void 0 || v === null || v === "") return void 0;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? void 0 : d;
}
function asString(v) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : void 0;
  return void 0;
}
function getParam(req, key) {
  return asString(req.params[key]);
}
var listUsers2 = asyncHandler(async (req, res) => {
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const search = asString(req.query.search);
  const role = asString(req.query.role);
  const status = asString(req.query.status);
  const emailVerified = typeof req.query.emailVerified === "string" ? req.query.emailVerified === "true" : void 0;
  const createdFrom = toDate(req.query.createdFrom);
  const createdTo = toDate(req.query.createdTo);
  const result = await listUsers({
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {},
    ...search !== void 0 ? { search } : {},
    ...role !== void 0 ? { role } : {},
    ...status !== void 0 ? { status } : {},
    ...emailVerified !== void 0 ? { emailVerified } : {},
    ...createdFrom !== void 0 ? { createdFrom } : {},
    ...createdTo !== void 0 ? { createdTo } : {}
  });
  res.json({ success: true, ...result });
});
var getUser = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const user = await getUserById(userId);
  res.json({ success: true, data: user });
});
var setUserRole2 = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  const role = req.body?.role;
  if (!userId) throw httpErrors.badRequest("userId is required.");
  if (typeof role !== "string")
    throw httpErrors.badRequest("role is required.");
  const user = await setUserRole(userId, role);
  res.json({ success: true, data: user });
});
var setUserStatus2 = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  const status = req.body?.status;
  if (!userId) throw httpErrors.badRequest("userId is required.");
  if (typeof status !== "string")
    throw httpErrors.badRequest("status is required.");
  const user = await setUserStatus(userId, status);
  res.json({ success: true, data: user });
});
var suspendUser2 = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const user = await suspendUser(userId);
  res.json({ success: true, data: user });
});
var activateUser2 = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const user = await activateUser(userId);
  res.json({ success: true, data: user });
});
var deleteUser = asyncHandler(async (req, res) => {
  const userId = getParam(req, "id") ?? getParam(req, "userId");
  if (!userId) throw httpErrors.badRequest("userId is required.");
  const result = await deleteUserHard(userId);
  res.json({ success: true, data: result });
});
var getAnalytics2 = asyncHandler(async (req, res) => {
  const from = toDate(req.query.from);
  const to = toDate(req.query.to);
  const topTutorsLimit = toNumber(req.query.topTutorsLimit);
  const analytics = await getAnalytics({
    ...from !== void 0 ? { from } : {},
    ...to !== void 0 ? { to } : {},
    ...topTutorsLimit !== void 0 ? { topTutorsLimit } : {}
  });
  res.json({ success: true, data: analytics });
});
var listReviews2 = asyncHandler(async (req, res) => {
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const tutorId = asString(req.query.tutorId);
  const studentId = asString(req.query.studentId);
  const minRating = toNumber(req.query.minRating);
  const maxRating = toNumber(req.query.maxRating);
  const createdFrom = toDate(req.query.createdFrom);
  const createdTo = toDate(req.query.createdTo);
  const result = await listReviews({
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {},
    ...tutorId !== void 0 ? { tutorId } : {},
    ...studentId !== void 0 ? { studentId } : {},
    ...minRating !== void 0 ? { minRating } : {},
    ...maxRating !== void 0 ? { maxRating } : {},
    ...createdFrom !== void 0 ? { createdFrom } : {},
    ...createdTo !== void 0 ? { createdTo } : {}
  });
  res.json({ success: true, ...result });
});
var deleteReview2 = asyncHandler(async (req, res) => {
  const reviewId = getParam(req, "id") ?? getParam(req, "reviewId");
  if (!reviewId) throw httpErrors.badRequest("reviewId is required.");
  const review = await deleteReview(reviewId);
  res.json({ success: true, data: review });
});
var listBookings2 = asyncHandler(async (req, res) => {
  const page = toNumber(req.query.page);
  const limit = toNumber(req.query.limit);
  const status = asString(req.query.status);
  const studentId = asString(req.query.studentId);
  const tutorId = asString(req.query.tutorId);
  const from = toDate(req.query.from);
  const to = toDate(req.query.to);
  const search = asString(req.query.search);
  const result = await listBookings({
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {},
    ...status !== void 0 ? { status } : {},
    ...studentId !== void 0 ? { studentId } : {},
    ...tutorId !== void 0 ? { tutorId } : {},
    ...from !== void 0 ? { from } : {},
    ...to !== void 0 ? { to } : {},
    ...search !== void 0 ? { search } : {}
  });
  res.json({ success: true, ...result });
});
var setTutorFeatured2 = asyncHandler(async (req, res) => {
  const tutorId = getParam(req, "id") ?? getParam(req, "tutorId");
  const isFeatured = req.body?.isFeatured;
  if (!tutorId) throw httpErrors.badRequest("tutorId is required.");
  if (typeof isFeatured !== "boolean")
    throw httpErrors.badRequest("isFeatured must be boolean.");
  const tutor = await setTutorFeatured(tutorId, isFeatured);
  res.json({ success: true, data: tutor });
});
var setTutorAvailability2 = asyncHandler(async (req, res) => {
  const tutorId = getParam(req, "id") ?? getParam(req, "tutorId");
  if (!tutorId) throw httpErrors.badRequest("tutorId is required.");
  const tutor = await setTutorAvailability(tutorId, req.body);
  res.json({ success: true, data: tutor });
});
var createCategory2 = asyncHandler(async (req, res) => {
  const category = await createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});
var updateCategory2 = asyncHandler(async (req, res) => {
  const categoryId = getParam(req, "id") ?? getParam(req, "categoryId");
  if (!categoryId) throw httpErrors.badRequest("categoryId is required.");
  const category = await updateCategory(categoryId, req.body);
  res.json({ success: true, data: category });
});
var deleteCategory2 = asyncHandler(async (req, res) => {
  const categoryId = getParam(req, "id") ?? getParam(req, "categoryId");
  if (!categoryId) throw httpErrors.badRequest("categoryId is required.");
  const category = await deleteCategory(categoryId);
  res.json({ success: true, data: category });
});

// src/modules/admin/admin.route.ts
var router = Router();
router.get("/users", requireAuth, requireAdmin, listUsers2);
router.get("/users/:id", requireAuth, requireAdmin, getUser);
router.patch(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  setUserRole2
);
router.patch(
  "/users/:id/status",
  requireAuth,
  requireAdmin,
  setUserStatus2
);
router.patch(
  "/users/:id/suspend",
  requireAuth,
  requireAdmin,
  suspendUser2
);
router.patch(
  "/users/:id/activate",
  requireAuth,
  requireAdmin,
  activateUser2
);
router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  deleteUser
);
router.get(
  "/analytics",
  requireAuth,
  requireAdmin,
  getAnalytics2
);
router.get("/reviews", requireAuth, requireAdmin, listReviews2);
router.delete(
  "/reviews/:id",
  requireAuth,
  requireAdmin,
  deleteReview2
);
router.get(
  "/bookings",
  requireAuth,
  requireAdmin,
  listBookings2
);
router.patch(
  "/tutors/:id/featured",
  requireAuth,
  requireAdmin,
  setTutorFeatured2
);
router.patch(
  "/tutors/:id/availability",
  requireAuth,
  requireAdmin,
  setTutorAvailability2
);
router.post(
  "/categories",
  requireAuth,
  requireAdmin,
  createCategory2
);
router.patch(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  updateCategory2
);
router.delete(
  "/categories/:id",
  requireAuth,
  requireAdmin,
  deleteCategory2
);
var adminRouter = router;

// src/modules/student/student.route.ts
import { Router as Router2 } from "express";

// src/modules/student/student.service.ts
function toPageMeta2(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}
function normalizePagination2(input) {
  const pageRaw = input?.page ?? 1;
  const limitRaw = input?.limit ?? 20;
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 20;
  return { page, limit, skip: (page - 1) * limit };
}
async function getMyStudentProfile(userId) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          tutor: { include: { user: true, category: true } },
          review: true
        }
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          tutor: { include: { user: true, category: true } },
          booking: true
        }
      }
    }
  });
}
async function upsertMyStudentProfile(userId, input) {
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
      group: input.group ?? "NONE"
    },
    update: {
      class: input.class,
      institute: input.institute,
      address: input.address,
      phone: input.phone,
      ...Object.prototype.hasOwnProperty.call(input, "profilePic") ? { profilePic: input.profilePic ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "bio") ? { bio: input.bio ?? null } : {},
      ...input.group ? { group: input.group } : {}
    },
    include: { user: true }
  });
}
async function updateMyStudentProfile(userId, input) {
  const existing = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true }
  });
  if (!existing) {
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first."
    );
  }
  return prisma.student.update({
    where: { userId },
    data: {
      ...typeof input.class === "string" ? { class: input.class } : {},
      ...typeof input.institute === "string" ? { institute: input.institute } : {},
      ...typeof input.address === "string" ? { address: input.address } : {},
      ...typeof input.phone === "string" ? { phone: input.phone } : {},
      ...Object.prototype.hasOwnProperty.call(input, "profilePic") ? { profilePic: input.profilePic ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "bio") ? { bio: input.bio ?? null } : {},
      ...input.group ? { group: input.group } : {}
    },
    include: { user: true }
  });
}
async function browseTutors(input = {}) {
  const { page, limit, skip } = normalizePagination2(input);
  const q = input.search?.trim();
  const where = {
    ...input.categoryId ? { categoryId: input.categoryId } : {},
    ...input.group ? { group: input.group } : {},
    ...typeof input.onlyAvailable === "boolean" ? { isAvailable: input.onlyAvailable } : {},
    ...typeof input.onlyFeatured === "boolean" ? { isFeatured: input.onlyFeatured } : {},
    ...(typeof input.minPricePerDay === "number" || typeof input.maxPricePerDay === "number") && {
      pricePerDay: {
        ...typeof input.minPricePerDay === "number" ? { gte: input.minPricePerDay } : {},
        ...typeof input.maxPricePerDay === "number" ? { lte: input.maxPricePerDay } : {}
      }
    },
    ...q ? {
      OR: [
        { subject: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } }
      ]
    } : {}
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
        reviews: { select: { rating: true } }
      }
    })
  ]);
  const data = tutors.map((t) => {
    const reviews = t.reviews ?? [];
    const ratings = reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const { reviews: _ignored, ...rest } = t;
    return { ...rest, avgRating, reviewsCount: ratings.length };
  });
  return { meta: toPageMeta2(page, limit, total), data };
}
async function getTutorDetails(tutorId) {
  const tutor = await prisma.tutor.findUnique({
    where: { tutorId },
    include: {
      user: true,
      category: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { student: { include: { user: true } }, booking: true }
      },
      bookings: { orderBy: { date: "desc" }, take: 10 }
    }
  });
  if (!tutor) return null;
  const reviews = tutor.reviews ?? [];
  const ratings = reviews.map((r) => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return { ...tutor, avgRating, reviewsCount: ratings.length };
}
async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
async function createMyBooking(userId, input) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true }
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first."
    );
  const tutor = await prisma.tutor.findUnique({
    where: { tutorId: input.tutorId },
    select: { tutorId: true, isAvailable: true }
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
      status: "CONFIRMED"
    },
    include: {
      tutor: { include: { user: true, category: true } },
      review: true
    }
  });
}
async function listMyBookings(userId, input = {}) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true }
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first."
    );
  const { page, limit, skip } = normalizePagination2(input);
  const where = {
    studentId: student.studentId,
    ...input.status ? { status: input.status } : {},
    ...(input.from || input.to) && {
      date: {
        ...input.from ? { gte: input.from } : {},
        ...input.to ? { lte: input.to } : {}
      }
    }
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
        review: true
      }
    })
  ]);
  return { meta: toPageMeta2(page, limit, total), data: bookings };
}
async function getMyBookingById(userId, bookingId) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true }
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first."
    );
  return prisma.booking.findFirst({
    where: { bookingId, studentId: student.studentId },
    include: {
      tutor: { include: { user: true, category: true } },
      student: { include: { user: true } },
      review: true
    }
  });
}
async function cancelMyBooking(userId, bookingId) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true }
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first."
    );
  const booking = await prisma.booking.findFirst({
    where: { bookingId, studentId: student.studentId },
    select: { bookingId: true, status: true }
  });
  if (!booking) throw httpErrors.notFound("Booking not found.");
  if (booking.status !== "CONFIRMED") {
    throw httpErrors.conflict("Only confirmed bookings can be cancelled.");
  }
  return prisma.booking.update({
    where: { bookingId },
    data: { status: "CANCELLED" }
  });
}
async function createMyReview(userId, input) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true }
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first."
    );
  const booking = await prisma.booking.findFirst({
    where: { bookingId: input.bookingId, studentId: student.studentId },
    include: { review: true }
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
      comment: input.comment ?? null
    },
    include: {
      tutor: { include: { user: true, category: true } },
      booking: true
    }
  });
}
async function listMyReviews(userId, input = {}) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true }
  });
  if (!student)
    throw httpErrors.notFound(
      "Student profile not found. Create your profile first."
    );
  const { page, limit, skip } = normalizePagination2(input);
  const where = { studentId: student.studentId };
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        tutor: { include: { user: true, category: true } },
        booking: true
      }
    })
  ]);
  return { meta: toPageMeta2(page, limit, total), data: reviews };
}

// src/modules/student/student.controller.ts
var asyncHandler2 = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (isHttpError(err)) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }
    console.error("Student controller error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message }
    });
  }
};
function requireUserId(req) {
  const userId = req.user?.id;
  if (!userId) throw httpErrors.unauthorized("Authentication required.");
  return userId;
}
function toNumber2(v) {
  if (v === void 0 || v === null || v === "") return void 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : void 0;
}
function toDate2(v) {
  if (v === void 0 || v === null || v === "") return void 0;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? void 0 : d;
}
function asString2(v) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : void 0;
  return void 0;
}
function getParam2(req, key) {
  return asString2(req.params[key]);
}
var getMyProfile = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await getMyStudentProfile(userId);
  res.json({ success: true, data: profile });
});
var upsertMyProfile = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await upsertMyStudentProfile(userId, req.body);
  res.json({ success: true, data: profile });
});
var updateMyProfile = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const profile = await updateMyStudentProfile(userId, req.body);
  res.json({ success: true, data: profile });
});
var browseTutors2 = asyncHandler2(async (req, res) => {
  const page = toNumber2(req.query.page);
  const limit = toNumber2(req.query.limit);
  const search = asString2(req.query.search);
  const categoryId = asString2(req.query.categoryId);
  const group = asString2(req.query.group);
  const minPricePerDay = toNumber2(req.query.minPricePerDay);
  const maxPricePerDay = toNumber2(req.query.maxPricePerDay);
  const onlyAvailable = typeof req.query.onlyAvailable === "string" ? req.query.onlyAvailable === "true" : void 0;
  const onlyFeatured = typeof req.query.onlyFeatured === "string" ? req.query.onlyFeatured === "true" : void 0;
  const result = await browseTutors({
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {},
    ...search !== void 0 ? { search } : {},
    ...categoryId !== void 0 ? { categoryId } : {},
    ...group !== void 0 ? { group } : {},
    ...minPricePerDay !== void 0 ? { minPricePerDay } : {},
    ...maxPricePerDay !== void 0 ? { maxPricePerDay } : {},
    ...onlyAvailable !== void 0 ? { onlyAvailable } : {},
    ...onlyFeatured !== void 0 ? { onlyFeatured } : {}
  });
  res.json({ success: true, ...result });
});
var getTutorDetails2 = asyncHandler2(async (req, res) => {
  const tutorId = getParam2(req, "id") ?? getParam2(req, "tutorId");
  if (!tutorId) throw httpErrors.badRequest("tutorId is required.");
  const tutor = await getTutorDetails(tutorId);
  res.json({ success: true, data: tutor });
});
var listCategories2 = asyncHandler2(async (_req, res) => {
  const categories = await listCategories();
  res.json({ success: true, data: categories });
});
var createBooking = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const payload = {
    ...req.body,
    date: toDate2(req.body?.date) ?? req.body?.date,
    time: toDate2(req.body?.time) ?? req.body?.time
  };
  const booking = await createMyBooking(userId, payload);
  res.status(201).json({ success: true, data: booking });
});
var listMyBookings2 = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const page = toNumber2(req.query.page);
  const limit = toNumber2(req.query.limit);
  const status = asString2(req.query.status);
  const from = toDate2(req.query.from);
  const to = toDate2(req.query.to);
  const result = await listMyBookings(userId, {
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {},
    ...status !== void 0 ? { status } : {},
    ...from !== void 0 ? { from } : {},
    ...to !== void 0 ? { to } : {}
  });
  res.json({ success: true, ...result });
});
var getMyBooking = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const bookingId = getParam2(req, "id") ?? getParam2(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const booking = await getMyBookingById(userId, bookingId);
  res.json({ success: true, data: booking });
});
var cancelBooking = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const bookingId = getParam2(req, "id") ?? getParam2(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const booking = await cancelMyBooking(userId, bookingId);
  res.json({ success: true, data: booking });
});
var createReview = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const review = await createMyReview(userId, req.body);
  res.status(201).json({ success: true, data: review });
});
var listMyReviews2 = asyncHandler2(async (req, res) => {
  const userId = requireUserId(req);
  const page = toNumber2(req.query.page);
  const limit = toNumber2(req.query.limit);
  const result = await listMyReviews(userId, {
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {}
  });
  res.json({ success: true, ...result });
});

// src/modules/student/student.route.ts
var router2 = Router2();
router2.get("/tutors", browseTutors2);
router2.get("/tutors/:id", getTutorDetails2);
router2.get("/categories", listCategories2);
router2.get(
  "/me",
  requireAuth,
  requireRole(UserRole.STUDENT),
  getMyProfile
);
router2.put(
  "/me",
  requireAuth,
  requireRole(UserRole.STUDENT),
  upsertMyProfile
);
router2.patch(
  "/me",
  requireAuth,
  requireRole(UserRole.STUDENT),
  updateMyProfile
);
router2.post(
  "/bookings",
  requireAuth,
  requireRole(UserRole.STUDENT),
  createBooking
);
router2.get(
  "/bookings",
  requireAuth,
  requireRole(UserRole.STUDENT),
  listMyBookings2
);
router2.get(
  "/bookings/:id",
  requireAuth,
  requireRole(UserRole.STUDENT),
  getMyBooking
);
router2.patch(
  "/bookings/:id/cancel",
  requireAuth,
  requireRole(UserRole.STUDENT),
  cancelBooking
);
router2.post(
  "/reviews",
  requireAuth,
  requireRole(UserRole.STUDENT),
  createReview
);
router2.get(
  "/reviews",
  requireAuth,
  requireRole(UserRole.STUDENT),
  listMyReviews2
);
var studentRouter = router2;

// src/modules/tutor/tutor.route.ts
import { Router as Router3 } from "express";

// src/modules/tutor/tutor.service.ts
function toPageMeta3(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}
function normalizePagination3(input) {
  const pageRaw = input?.page ?? 1;
  const limitRaw = input?.limit ?? 20;
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 20;
  return { page, limit, skip: (page - 1) * limit };
}
async function getMyTutorProfile(userId) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    include: {
      user: true,
      category: true,
      bookings: {
        orderBy: { date: "desc" },
        take: 5,
        include: { student: { include: { user: true } }, review: true }
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { student: { include: { user: true } }, booking: true }
      }
    }
  });
  if (!tutor) return null;
  const reviews = tutor.reviews ?? [];
  const ratings = reviews.map((r) => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return { ...tutor, avgRating, reviewsCount: ratings.length };
}
async function upsertMyTutorProfile(userId, input) {
  const category = await prisma.category.findUnique({
    where: { categoryId: input.categoryId },
    select: { categoryId: true }
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
      isAvailable: true
    },
    update: {
      subject: input.subject,
      experience: input.experience,
      address: input.address,
      phone: input.phone,
      ...Object.prototype.hasOwnProperty.call(input, "profilePic") ? { profilePic: input.profilePic ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "bio") ? { bio: input.bio ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "institute") ? { institute: input.institute ?? null } : {},
      group: input.group,
      categoryId: input.categoryId,
      pricePerDay: input.pricePerDay
    },
    include: { user: true, category: true }
  });
}
async function updateMyTutorProfile(userId, input) {
  const existing = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true }
  });
  if (!existing) {
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first."
    );
  }
  if (typeof input.categoryId === "string") {
    const category = await prisma.category.findUnique({
      where: { categoryId: input.categoryId },
      select: { categoryId: true }
    });
    if (!category) {
      throw httpErrors.notFound("Category not found.", "INVALID_CATEGORY");
    }
  }
  return prisma.tutor.update({
    where: { userId },
    data: {
      ...typeof input.subject === "string" ? { subject: input.subject } : {},
      ...typeof input.experience === "number" ? { experience: input.experience } : {},
      ...typeof input.address === "string" ? { address: input.address } : {},
      ...typeof input.phone === "string" ? { phone: input.phone } : {},
      ...Object.prototype.hasOwnProperty.call(input, "profilePic") ? { profilePic: input.profilePic ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "bio") ? { bio: input.bio ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "institute") ? { institute: input.institute ?? null } : {},
      ...input.group ? { group: input.group } : {},
      ...typeof input.categoryId === "string" ? { categoryId: input.categoryId } : {},
      ...typeof input.pricePerDay === "number" ? { pricePerDay: input.pricePerDay } : {}
    },
    include: { user: true, category: true }
  });
}
async function setMyAvailability(userId, input) {
  const existing = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true }
  });
  if (!existing)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first."
    );
  return prisma.tutor.update({
    where: { userId },
    data: {
      isAvailable: input.isAvailable,
      ...Object.prototype.hasOwnProperty.call(input, "availableFrom") ? { availableFrom: input.availableFrom ?? null } : {},
      ...Object.prototype.hasOwnProperty.call(input, "availableTo") ? { availableTo: input.availableTo ?? null } : {}
    }
  });
}
async function listMySessions(userId, input = {}) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true }
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first."
    );
  const { page, limit, skip } = normalizePagination3(input);
  const q = input.studentSearch?.trim();
  const where = {
    tutorId: tutor.tutorId,
    ...input.status ? { status: input.status } : {},
    ...(input.from || input.to) && {
      date: {
        ...input.from ? { gte: input.from } : {},
        ...input.to ? { lte: input.to } : {}
      }
    },
    ...q ? {
      student: {
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } }
          ]
        }
      }
    } : {}
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
        review: true
      }
    })
  ]);
  return { meta: toPageMeta3(page, limit, total), data: sessions };
}
async function getMySessionById(userId, bookingId) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true }
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first."
    );
  return prisma.booking.findFirst({
    where: { bookingId, tutorId: tutor.tutorId },
    include: {
      student: { include: { user: true } },
      tutor: { include: { user: true, category: true } },
      review: true
    }
  });
}
async function markSessionCompleted(userId, bookingId) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true }
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first."
    );
  const booking = await prisma.booking.findFirst({
    where: { bookingId, tutorId: tutor.tutorId },
    select: { bookingId: true, status: true }
  });
  if (!booking) throw httpErrors.notFound("Booking not found.");
  if (booking.status !== "CONFIRMED") {
    throw httpErrors.conflict(
      "Only confirmed sessions can be marked completed."
    );
  }
  return prisma.booking.update({
    where: { bookingId },
    data: { status: "COMPLETED" }
  });
}
async function listMyReviews3(userId, input = {}) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true }
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first."
    );
  const { page, limit, skip } = normalizePagination3(input);
  const where = {
    tutorId: tutor.tutorId,
    ...(typeof input.minRating === "number" || typeof input.maxRating === "number") && {
      rating: {
        ...typeof input.minRating === "number" ? { gte: input.minRating } : {},
        ...typeof input.maxRating === "number" ? { lte: input.maxRating } : {}
      }
    }
  };
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { student: { include: { user: true } }, booking: true }
    })
  ]);
  return { meta: toPageMeta3(page, limit, total), data: reviews };
}
async function getMyDashboardStats(userId) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true }
  });
  if (!tutor)
    throw httpErrors.notFound(
      "Tutor profile not found. Create your profile first."
    );
  const [
    totalSessions,
    confirmedSessions,
    completedSessions,
    cancelledSessions,
    ratingAgg
  ] = await prisma.$transaction([
    prisma.booking.count({ where: { tutorId: tutor.tutorId } }),
    prisma.booking.count({
      where: { tutorId: tutor.tutorId, status: "CONFIRMED" }
    }),
    prisma.booking.count({
      where: { tutorId: tutor.tutorId, status: "COMPLETED" }
    }),
    prisma.booking.count({
      where: { tutorId: tutor.tutorId, status: "CANCELLED" }
    }),
    prisma.review.aggregate({
      where: { tutorId: tutor.tutorId },
      _avg: { rating: true },
      _count: { _all: true }
    })
  ]);
  return {
    sessions: {
      total: totalSessions,
      confirmed: confirmedSessions,
      completed: completedSessions,
      cancelled: cancelledSessions
    },
    reviews: {
      averageRating: ratingAgg._avg.rating ?? 0,
      count: ratingAgg._count._all
    }
  };
}
async function listCategories3() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

// src/modules/tutor/tutor.controller.ts
var asyncHandler3 = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (isHttpError(err)) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }
    console.error("Tutor controller error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message }
    });
  }
};
function requireUserId2(req) {
  const userId = req.user?.id;
  if (!userId) throw httpErrors.unauthorized("Authentication required.");
  return userId;
}
function toNumber3(v) {
  if (v === void 0 || v === null || v === "") return void 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : void 0;
}
function toDate3(v) {
  if (v === void 0 || v === null || v === "") return void 0;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? void 0 : d;
}
function asString3(v) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : void 0;
  return void 0;
}
function getParam3(req, key) {
  return asString3(req.params[key]);
}
var getMyProfile2 = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const profile = await getMyTutorProfile(userId);
  res.json({ success: true, data: profile });
});
var upsertMyProfile2 = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const profile = await upsertMyTutorProfile(userId, req.body);
  res.json({ success: true, data: profile });
});
var updateMyProfile2 = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const profile = await updateMyTutorProfile(userId, req.body);
  res.json({ success: true, data: profile });
});
var setAvailability = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const payload = {
    ...req.body,
    availableFrom: toDate3(req.body?.availableFrom) ?? req.body?.availableFrom,
    availableTo: toDate3(req.body?.availableTo) ?? req.body?.availableTo
  };
  const tutor = await setMyAvailability(userId, payload);
  res.json({ success: true, data: tutor });
});
var listMySessions2 = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const page = toNumber3(req.query.page);
  const limit = toNumber3(req.query.limit);
  const status = asString3(req.query.status);
  const from = toDate3(req.query.from);
  const to = toDate3(req.query.to);
  const studentSearch = asString3(req.query.studentSearch);
  const result = await listMySessions(userId, {
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {},
    ...status !== void 0 ? { status } : {},
    ...from !== void 0 ? { from } : {},
    ...to !== void 0 ? { to } : {},
    ...studentSearch !== void 0 ? { studentSearch } : {}
  });
  res.json({ success: true, ...result });
});
var getMySession = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const bookingId = getParam3(req, "id") ?? getParam3(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const session = await getMySessionById(userId, bookingId);
  res.json({ success: true, data: session });
});
var markCompleted = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const bookingId = getParam3(req, "id") ?? getParam3(req, "bookingId");
  if (!bookingId) throw httpErrors.badRequest("bookingId is required.");
  const session = await markSessionCompleted(userId, bookingId);
  res.json({ success: true, data: session });
});
var listMyReviews4 = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const page = toNumber3(req.query.page);
  const limit = toNumber3(req.query.limit);
  const minRating = toNumber3(req.query.minRating);
  const maxRating = toNumber3(req.query.maxRating);
  const result = await listMyReviews3(userId, {
    ...page !== void 0 ? { page } : {},
    ...limit !== void 0 ? { limit } : {},
    ...minRating !== void 0 ? { minRating } : {},
    ...maxRating !== void 0 ? { maxRating } : {}
  });
  res.json({ success: true, ...result });
});
var getDashboardStats = asyncHandler3(async (req, res) => {
  const userId = requireUserId2(req);
  const stats = await getMyDashboardStats(userId);
  res.json({ success: true, data: stats });
});
var listCategories4 = asyncHandler3(async (_req, res) => {
  const categories = await listCategories3();
  res.json({ success: true, data: categories });
});

// src/modules/tutor/tutor.route.ts
var router3 = Router3();
router3.get(
  "/me",
  requireAuth,
  requireRole(UserRole.TUTOR),
  getMyProfile2
);
router3.put(
  "/me",
  requireAuth,
  requireRole(UserRole.TUTOR),
  upsertMyProfile2
);
router3.patch(
  "/me",
  requireAuth,
  requireRole(UserRole.TUTOR),
  updateMyProfile2
);
router3.put(
  "/availability",
  requireAuth,
  requireRole(UserRole.TUTOR),
  setAvailability
);
router3.get(
  "/sessions",
  requireAuth,
  requireRole(UserRole.TUTOR),
  listMySessions2
);
router3.get(
  "/sessions/:id",
  requireAuth,
  requireRole(UserRole.TUTOR),
  getMySession
);
router3.patch(
  "/sessions/:id/complete",
  requireAuth,
  requireRole(UserRole.TUTOR),
  markCompleted
);
router3.get(
  "/reviews",
  requireAuth,
  requireRole(UserRole.TUTOR),
  listMyReviews4
);
router3.get(
  "/dashboard",
  requireAuth,
  requireRole(UserRole.TUTOR),
  getDashboardStats
);
router3.get(
  "/categories",
  requireAuth,
  requireRole(UserRole.TUTOR),
  listCategories4
);
var tutorRouter = router3;

// src/index.ts
var app = express();
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true
  })
);
app.use(express.json());
app.all("/api/v1/auth/*splat", toNodeHandler(auth));
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/tutor", tutorRouter);
app.use("/api/v1/admin", adminRouter);
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.get("/api", (req, res) => {
  res.send("Hello World");
});
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found." }
  });
});
app.use(
  (err, _req, res, _next) => {
    if (isHttpError(err)) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }
    console.error("Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message }
    });
  }
);
var index_default = app;
export {
  index_default as default
};
