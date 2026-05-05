import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { httpErrors } from "../../utils/httpError";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(userId: string, input: {
  tutorId: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { studentId: true, user: { select: { email: true } } },
  });
  if (!student) throw httpErrors.notFound("Student profile not found.");

  const tutor = await prisma.tutor.findUnique({
    where: { tutorId: input.tutorId },
    select: { tutorId: true, pricePerDay: true, user: { select: { name: true } } },
  });
  if (!tutor) throw httpErrors.notFound("Tutor not found.");

  const amount = tutor.pricePerDay;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: process.env.STRIPE_CURRENCY || "usd",
          product_data: {
            name: `Tutor Session with ${tutor.user.name}`,
            description: `Session on ${input.date}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.APP_URL}/student/bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/tutors/${input.tutorId}?canceled=true`,
    customer_email: student.user.email,
    metadata: {
      studentId: student.studentId,
      tutorId: tutor.tutorId,
      date: input.date,
      time: input.time,
      duration: input.duration.toString(),
      notes: input.notes || "",
    },
  });

  // Create a pending payment record (without bookingId for now)
  await prisma.payment.create({
    data: {
      studentId: student.studentId,
      tutorId: tutor.tutorId,
      amount: amount,
      currency: process.env.STRIPE_CURRENCY || "usd",
      stripeSessionId: session.id,
      status: "PENDING",
    },
  });

  return { sessionId: session.id, url: session.url };
}

export async function fulfillOrder(sessionId: string, session?: any) {
  if (!session) {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  }

  if (session.payment_status !== "paid") {
    return { success: false, message: "Payment not completed" };
  }

  const metadata = session.metadata;
  if (!metadata) {
    return { success: false, message: "No metadata found in session" };
  }

  const { studentId, tutorId, date, time, duration, notes } = metadata;

  // Check if already fulfilled to prevent double booking
  const existingPayment = await prisma.payment.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (existingPayment?.status === "COMPLETED" && existingPayment.bookingId) {
    return { success: true, message: "Order already fulfilled" };
  }

  await prisma.$transaction(async (tx) => {
    // 1. Create the booking
    const booking = await tx.booking.create({
      data: {
        studentId,
        tutorId,
        date: new Date(date),
        time: new Date(time),
        duration: Number(duration),
        notes: notes || null,
        status: "CONFIRMED",
      },
    });

    // 2. Update the payment
    await tx.payment.update({
      where: { stripeSessionId: sessionId },
      data: {
        status: "COMPLETED",
        bookingId: booking.bookingId,
      },
    });
  });

  console.log(`Booking and Payment created successfully for session ${sessionId}`);
  return { success: true };
}

export async function verifySession(sessionId: string) {
  return fulfillOrder(sessionId);
}

export async function handleWebhook(signature: string, payload: any) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    throw httpErrors.badRequest(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    await fulfillOrder(session.id, session);
  }

  return { received: true };
}

export async function listTutorPayments(userId: string, page: number = 1, limit: number = 10) {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { tutorId: true },
  });
  if (!tutor) throw httpErrors.notFound("Tutor profile not found.");

  const skip = (page - 1) * limit;

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where: { tutorId: tutor.tutorId } }),
    prisma.payment.findMany({
      where: { tutorId: tutor.tutorId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        student: { include: { user: { select: { name: true, email: true, image: true } } } },
        booking: true,
      } as any,
    }),
  ]);

  return {
    data: payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
