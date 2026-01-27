import "dotenv/config";
import nodemailer from "nodemailer";

// Custom error class for email-related errors
export class EmailError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

// Validate required environment variables
const validateEmailConfig = (): void => {
  if (!process.env.EMAIL_HOST_USER) {
    throw new EmailError("EMAIL_HOST_USER environment variable is not set");
  }
  if (!process.env.EMAIL_HOST_PASSWORD) {
    throw new EmailError("EMAIL_HOST_PASSWORD environment variable is not set");
  }
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use true for port 465, false for port 587
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });
};

export const sendMail = async (
  mailOptions: nodemailer.SendMailOptions,
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    // Validate configuration before attempting to send
    validateEmailConfig();

    // Validate required mail options
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
      `Email sent successfully to ${mailOptions.to}. MessageId: ${info.messageId}`,
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log the error with details
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send email to ${mailOptions.to}: ${errorMessage}`);

    // Re-throw as EmailError if not already one
    if (error instanceof EmailError) {
      throw error;
    }

    throw new EmailError(`Failed to send email: ${errorMessage}`, error);
  }
};
