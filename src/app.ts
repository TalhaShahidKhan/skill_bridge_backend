import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./lib/auth";
import { adminRouter } from "./modules/admin/admin.route";
import { studentRouter } from "./modules/student/student.route";
import { tutorRouter } from "./modules/tutor/tutor.route";
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
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/tutor", tutorRouter);
app.use("/api/v1/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});
// Vercel mounts the serverless function at /api, so root requests arrive as /api
app.get("/api", (req, res) => {
  res.send("Hello World");
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
