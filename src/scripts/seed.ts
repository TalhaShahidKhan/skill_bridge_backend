import { UserRole, UserStatus } from "../lib/constants";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Starting seeding...");

  // 1. Seed Categories
  console.log("Creating categories...");
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Academic" },
      update: {},
      create: {
        name: "Academic",
        subjects: [
          "Mathematics",
          "Physics",
          "Chemistry",
          "Biology",
          "English",
          "ICT",
        ],
      },
    }),
    prisma.category.upsert({
      where: { name: "Skills" },
      update: {},
      create: {
        name: "Skills",
        subjects: [
          "Web Design",
          "Graphic Design",
          "Content Writing",
          "Digital Marketing",
        ],
      },
    }),
    prisma.category.upsert({
      where: { name: "Language" },
      update: {},
      create: {
        name: "Language",
        subjects: ["English Speaking", "IELTS", "Arabic", "French"],
      },
    }),
  ]);

  // 2. Seed Students
  console.log("Creating students...");
  const studentData = [
    { name: "Rafiq Islam", email: "rafiq@student.com" },
    { name: "Sumi Akter", email: "sumi@student.com" },
    { name: "Tanvir Ahmed", email: "tanvir@student.com" },
    { name: "Nadia Zaman", email: "nadia@student.com" },
    { name: "Arif Karim", email: "arif@student.com" },
  ];

  const students = [];
  for (const data of studentData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        id: `student-${data.email.split("@")[0]}`,
        name: data.name,
        email: data.email,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        class: "Class 10",
        institute: "Dhaka Residential Model College",
        address: "Dhanmondi, Dhaka",
        phone: "01712345678",
        group: "SCIENCE",
        bio: "Determined student looking to improve in core subjects.",
      },
    });
    students.push(student);
  }

  // 3. Seed Tutors
  console.log("Creating tutors...");
  const tutorData = [
    {
      name: "Dr. Ahmed Ullah",
      email: "ahmed@tutor.com",
      subject: "Physics",
      categoryIdx: 0,
    },
    {
      name: "Mst. Sharmin",
      email: "sharmin@tutor.com",
      subject: "Mathematics",
      categoryIdx: 0,
    },
    {
      name: "John Doe",
      email: "john@tutor.com",
      subject: "Web Design",
      categoryIdx: 1,
    },
    {
      name: "Sayeeda Khan",
      email: "sayeeda@tutor.com",
      subject: "English",
      categoryIdx: 2,
    },
    {
      name: "Zubair Al-Amin",
      email: "zubair@tutor.com",
      subject: "Chemistry",
      categoryIdx: 0,
    },
  ];

  const tutors = [];
  for (const data of tutorData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        id: `tutor-${data.email.split("@")[0]}`,
        name: data.name,
        email: data.email,
        role: UserRole.TUTOR,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const category = categories[data.categoryIdx];
    if (!category) continue;

    const tutor = await prisma.tutor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        categoryId: category.categoryId,
        subjects: [data.subject],
        experience: 5,
        address: "Gulshan, Dhaka",
        phone: "01887654321",
        institute: "BUET",
        group: "SCIENCE",
        bio: `Professional ${data.subject} tutor with years of experience.`,
        pricePerDay: 500 + Math.random() * 1000,
        isFeatured: Math.random() > 0.5,
        isAvailable: true,
      },
    });
    tutors.push(tutor);
  }

  // 4. Seed Bookings & Reviews
  console.log("Creating bookings and reviews...");
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const tutor = tutors[Math.floor(Math.random() * tutors.length)];

    if (!student || !tutor) continue;

    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    const statuses = ["CONFIRMED", "COMPLETED", "CANCELLED"];
    const status = statuses[Math.floor(Math.random() * 3)] as any;

    const booking = await prisma.booking.create({
      data: {
        studentId: student.studentId,
        tutorId: tutor.tutorId,
        date: date,
        time: date,
        duration: 2,
        status: status,
        notes: "Help with project work.",
      },
    });

    if (status === "COMPLETED" && Math.random() > 0.3) {
      await prisma.review.create({
        data: {
          bookingId: booking.bookingId,
          studentId: student.studentId,
          tutorId: tutor.tutorId,
          rating: Math.floor(Math.random() * 2) + 4,
          comment: "Excellent tutor, very helpful!",
        },
      });
    }
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
