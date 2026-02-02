import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendMail } from "../utils/sendMail";
import { UserRole, UserStatus } from "./constants";
import { prisma } from "./prisma";

if (!process.env.APP_URL) {
  console.warn("APP_URL is not defined. Authentication might fail.");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: `${process.env.BETTER_AUTH_URL}/api/auth`,
  trustedOrigins: [process.env.APP_URL || "http://localhost:3000"],
  cookie: {
    name: "skill_bridge_auth",
    httpOnly: true,
    sameSite: "none",
    secure: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.STUDENT,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      try {
        const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Password Reset Request",
          text: `Click here to reset your password: ${resetUrl}`,
        };
        await sendMail(mailOptions);
      } catch (error) {
        console.error(
          `Failed to send password reset email to ${user.email}:`,
          error,
        );
        // Don't throw - allow the reset flow to continue even if email fails
        // The user can request a new reset link if needed
      }
    },
    onPasswordReset: async ({ user }, request) => {
      try {
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Password Reset Successful",
          text: "Your password has been reset successfully.",
        };
        await sendMail(mailOptions);
      } catch (error) {
        console.error(
          `Failed to send password reset confirmation to ${user.email}:`,
          error,
        );
        // Don't throw - this is a notification, not critical for the flow
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Verify your email address",
          text: `Please click on the following link to verify your email address: ${verificationUrl}`,
        };
        await sendMail(mailOptions);
      } catch (error) {
        console.error(
          `Failed to send verification email to ${user.email}:`,
          error,
        );
        throw error; // Re-throw for verification - this is critical for the signup flow
      }
    },
  },
});
