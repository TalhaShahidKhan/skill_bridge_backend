import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./lib/auth";
import { adminRouter } from "./modules/admin/admin.route";
import { studentRouter } from "./modules/student/student.route";
import {
  publicCategoriesRouter,
  publicTutorRouter,
  tutorRouter,
} from "./modules/tutor/tutor.route";
import { paymentRouter } from "./modules/payment/payment.route";
import { isHttpError } from "./utils/httpError";

const app = express();
app.set("trust proxy", 1);

// CORS configuration
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

// Health checks and root routes
const rootHandler = (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: "Skill Bridge API is running",
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
};

app.get("/", rootHandler);
app.get("/api", rootHandler);

// Stripe webhook needs raw body, must come before express.json()
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// API v1 routes
app.use("/api/student", studentRouter);
app.use("/api/tutor", tutorRouter);
app.use("/api/tutors", publicTutorRouter);
app.use("/api/categories", publicCategoriesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payment", paymentRouter);

// 404 handler
app.use((req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.url} not found.`,
    },
  });
});

// Global error handler (fallback)
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (isHttpError(err)) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }

    console.error("Unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message },
    });
  },
);

export default app;
