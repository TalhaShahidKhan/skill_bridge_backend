import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";

// Define user roles
import {
  UserRole,
  UserRoleType,
  UserStatus,
  UserStatusType,
} from "../lib/constants";

// Type for authenticated user
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: UserRoleType;
  status: UserStatusType;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
      };
    }
  }
}

/**
 * Helper to check user status and return appropriate error if not active
 */
const checkUserStatus = (
  user: AuthenticatedUser,
): { error: { code: string; message: string }; status: number } | null => {
  if (user.status === UserStatus.SUSPENDED) {
    return {
      status: 403,
      error: {
        code: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended.",
      },
    };
  }

  if (user.status === UserStatus.INACTIVE) {
    return {
      status: 403,
      error: {
        code: "ACCOUNT_INACTIVE",
        message: "Your account is inactive.",
      },
    };
  }

  return null;
};

/**
 * Middleware to require authentication
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log in.",
        },
      });
    }

    const user = session.user as unknown as AuthenticatedUser;

    // Check account status
    const statusError = checkUserStatus(user);
    if (statusError) {
      return res.status(statusError.status).json({
        success: false,
        error: statusError.error,
      });
    }

    // Attach to request
    req.user = user;
    req.session = session.session;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Internal server error during authentication.",
      },
    });
  }
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (...allowedRoles: UserRoleType[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // If user is not already attached (e.g. used without requireAuth), try to authenticate
    if (!req.user) {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
          return res.status(401).json({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required. Please log in.",
            },
          });
        }

        req.user = session.user as unknown as AuthenticatedUser;
        req.session = session.session;
      } catch (e) {
        console.error("Role middleware auth check error:", e);
        return res.status(500).json({
          success: false,
          error: { code: "SERVER_ERROR", message: "Error checking role" },
        });
      }
    }

    // Check account status (important if requireRole is used standalone or if status changed)
    const statusError = checkUserStatus(req.user);
    if (statusError) {
      return res.status(statusError.status).json({
        success: false,
        error: statusError.error,
      });
    }

    // Check Role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions.",
        },
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
