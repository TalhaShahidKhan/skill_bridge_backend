# Skill Bridge

<p align="center">
  <img src="./skillbridge_logo.png" alt="Skill Bridge Logo" width="320" />
</p>

**Skill Bridge** is a tutoring platform backend that connects students with qualified tutors. It provides a REST API for user authentication, student–tutor matching, booking management, reviews, and administrative oversight—supporting learning, growth, and knowledge sharing across subjects and study groups.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Authentication & Authorization](#authentication--authorization)
  - [Student Features](#student-features)
  - [Tutor Features](#tutor-features)
  - [Admin Features](#admin-features)
  - [Payment System (Stripe)](#payment-system-stripe)
- [API Overview](#api-overview)
- [Getting Started](#getting-started)
- [Environment](#environment)
- [Scripts](#scripts)
- [Data Model](#data-model)
- [License](#license)

---

## Overview

Skill Bridge is built as a **Node.js + Express + TypeScript** API. It uses **Prisma** with **PostgreSQL** for persistence, **better-auth** for authentication, and **Stripe** for secure payments.

The platform supports:

- **Students**: Browsing tutors, managing profile, secure payments via Stripe, and tracking bookings.
- **Tutors**: Profile management, availability control, and earning tracking via a dedicated payment dashboard.
- **Admins**: User moderation, analytics, and platform oversight.

---

## Tech Stack

| Layer     | Technology                             |
| --------- | -------------------------------------- |
| Runtime   | Node.js                                |
| Framework | Express 5                              |
| Language  | TypeScript                             |
| ORM / DB  | Prisma 7 + PostgreSQL                  |
| Auth      | better-auth                            |
| Payment   | Stripe API                             |
| Email     | Nodemailer (HTML Templates)            |
| Security  | Helmet, Express-Rate-Limit             |

---

## Features

### Authentication & Authorization

- **Email & password sign-up and sign-in**  
- **HTML Email Verification**  
  Modern, responsive HTML emails sent via Nodemailer for account verification.
- **Secure Password Reset**  
  HTML-formatted reset links with token verification.
- **Logged-in Password Change**  
  Users can securely update their passwords from their profile settings.
- **Role-based access** (`STUDENT`, `TUTOR`, `ADMIN`)

### Student Features

- **Profile management**
- **Tutor Discovery** with advanced filtering.
- **Secure Booking** – Session creation triggered only after successful Stripe payment.
- **Review System** – Rate tutors after completed sessions.

### Tutor Features

- **Professional Profile**
- **Availability Management**
- **Payment History** – Dedicated dashboard to track all earned fees and transaction details.
- **Session Management**

### Admin Features

- **Analytics Dashboard**
- **User & Review Moderation**
- **Category Management**

### Payment System (Stripe)

Skill Bridge integrates Stripe for a secure, upfront payment workflow:
- **Upfront Payments**: Students pay before a booking is confirmed in the database.
- **Webhooks**: Automated booking confirmation and payment tracking via Stripe webhooks.
- **Transaction Safety**: Uses Stripe Checkout for a premium, PCI-compliant payment experience.

---

## API Overview

| Base path           | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `/api/auth/*`       | better-auth handlers (sign-in, sign-up, verification, password reset)           |
| `/api/student/*`    | Student profile, browse tutors, categories, bookings, reviews                   |
| `/api/tutor/*`      | Tutor profile, availability, sessions, reviews, dashboard, payments             |
| `/api/admin/*`      | Users, analytics, reviews, tutors, categories                                   |
| `/api/payment/*`    | Stripe Checkout session creation and Webhook handling                           |

---

## Getting Started

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Database**
   `npx prisma migrate dev`

3. **Environment**
   Configure your `.env` file (see [Environment](#environment)).

4. **Run**
   `npm run dev`

---

## Environment

| Variable                | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string                    |
| `APP_URL`               | Frontend URL (e.g. http://localhost:3000)       |
| `STRIPE_SECRET_KEY`     | Your Stripe Secret Key                          |
| `STRIPE_WEBHOOK_SECRET` | Secret for verifying Stripe webhooks            |
| `STRIPE_CURRENCY`       | Currency for payments (e.g. `bdt`, `usd`)       |
| `EMAIL_HOST_USER`       | SMTP email address                              |
| `EMAIL_HOST_PASSWORD`   | SMTP app password                               |

---

## Scripts

| Script  | Command                       | Description                       |
| ------- | ----------------------------- | --------------------------------- |
| `dev`   | `npx tsx watch src/server.ts` | Run server in development         |
| `build` | `tsc`                         | Compile to `dist/`                |
| `start` | `node dist/index.js`          | Run production build              |

---

## Data Model

- **User** – Auth account.
- **Student** – Student profile.
- **Tutor** – Professional tutor profile.
- **Booking** – Session records (CONFIRMED after payment).
- **Payment** – Transaction history (linked to Stripe).
- **Category** – Subject groupings.
- **Review** – Student feedback.

---

## License

ISC

---

<p align="center">
  <strong>Skill Bridge</strong> — Bridging knowledge and growth through learning.
</p>
