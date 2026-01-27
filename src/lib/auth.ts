import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendMail } from "../utils/sendMail";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.APP_URL!],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "USER",
      },
      status: {
        type: "string",
        required: true,
        defaultValue: "ACTIVE",
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
    sendResetPassword: async ({ user, url }) => {
      try {
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Password Reset Request",
          text: `Click here to reset your password: ${url}`,
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
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
        const mailOptions = {
          from: process.env.EMAIL_HOST_USER,
          to: user.email,
          subject: "Verify your email address",
          text: `Please click on the following link to verify your email address: ${url}`,
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
