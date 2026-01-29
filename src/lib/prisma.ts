import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Check if we are in a build environment (like Vercel build step) where DB might not be needed immediately
  // But for runtime, it is required.
  console.warn("DATABASE_URL is not defined.");
}

const pool = new Pool({ connectionString: connectionString || "" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
