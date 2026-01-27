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
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const mailOptions = {
        from: process.env.EMAIL_HOST_USER,
        to: user.email,
        subject: "Password Reset Request",
        text: `Click here to reset your password: ${url}`,
      };
      await sendMail(mailOptions);
    },
    onPasswordReset: async ({ user }, request) => {
      const mailOptions = {
        from: process.env.EMAIL_HOST_USER,
        to: user.email,
        subject: "Password Reset successfull",
        text: "Your Password has been reset successfully.",
      };
      await sendMail(mailOptions);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL_HOST_USER,
        to: user.email,
        subject: "Verify your email address",
        text: `Please click on the following link to verify your email address: ${url}`,
      };
      await sendMail(mailOptions);
    },
  },
});
