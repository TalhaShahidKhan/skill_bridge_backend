import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

// Custom error class for seeding errors
class SeedError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "SeedError";
  }
}

// Validate environment variables with specific error messages
const validateEnvVariables = (): {
  email: string;
  password: string;
  name: string;
} => {
  const missingVars: string[] = [];

  if (!process.env.ADMIN_EMAIL) missingVars.push("ADMIN_EMAIL");
  if (!process.env.ADMIN_PASSWORD) missingVars.push("ADMIN_PASSWORD");
  if (!process.env.ADMIN_NAME) missingVars.push("ADMIN_NAME");

  if (missingVars.length > 0) {
    throw new SeedError(
      `Missing required environment variables: ${missingVars.join(", ")}`,
      "ENV_MISSING",
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.ADMIN_EMAIL!)) {
    throw new SeedError(
      "ADMIN_EMAIL is not a valid email address",
      "INVALID_EMAIL",
    );
  }

  // Validate password strength
  if (process.env.ADMIN_PASSWORD!.length < 8) {
    throw new SeedError(
      "ADMIN_PASSWORD must be at least 8 characters long",
      "WEAK_PASSWORD",
    );
  }

  return {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    name: process.env.ADMIN_NAME!,
  };
};

const seedAdmin = async (): Promise<void> => {
  console.log("Starting admin seeding process...");

  try {
    // Validate environment variables
    const { email, password, name } = validateEnvVariables();
    console.log(`Attempting to create admin user: ${email}`);

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`Admin user already exists with email: ${email}`);
      console.log("Skipping admin creation.");
      return;
    }

    // Create admin user
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!result) {
      throw new SeedError(
        "Failed to create admin user - no result returned",
        "CREATE_FAILED",
      );
    }

    // Update user role to ADMIN
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    console.log("Admin seeded successfully!");
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${name}`);
    console.log(`  Role: ADMIN`);
  } catch (error) {
    if (error instanceof SeedError) {
      console.error(`[${error.code}] ${error.message}`);
      process.exit(1);
    }

    // Handle Prisma/database errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        console.error(
          "Admin user with this email already exists in the database.",
        );
        process.exit(1);
      }
      console.error(`Unexpected error: ${error.message}`);
    } else {
      console.error("An unknown error occurred:", error);
    }

    process.exit(1);
  }
};

// Run the seeder
seedAdmin()
  .then(() => {
    console.log("Seeding completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error during seeding:", error);
    process.exit(1);
  });
