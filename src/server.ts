import app from ".";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port  http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("An error Occured:", error);
    prisma.$disconnect();
    process.exit(1);
  }
}

main();
