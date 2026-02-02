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
import { isHttpError } from "./utils/httpError";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
// API v1 routes
app.use("/api/student", studentRouter);
app.use("/api/tutor", tutorRouter);
app.use("/api/tutors", publicTutorRouter);
app.use("/api/categories", publicCategoriesRouter);
app.use("/api/admin", adminRouter);
app.get("/api/test", (req, res) => {
  res.json({ message: "Skill Bridge API is running" });
});
// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found." },
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
