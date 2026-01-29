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
- [API Overview](#api-overview)
- [Getting Started](#getting-started)
- [Deploy on Vercel](#deploy-on-vercel)
- [Environment](#environment)
- [Scripts](#scripts)
- [Data Model](#data-model)
- [License](#license)

---

## Overview

Skill Bridge is built as a **Node.js + Express + TypeScript** API. It uses **Prisma** with **PostgreSQL** for persistence, **better-auth** for authentication (including email verification and password reset), and **Nodemailer** for transactional emails. The API is organized into three main role-based modules: **Student**, **Tutor**, and **Admin**, each with dedicated routes and business logic.

The platform supports:

- **Students**: Browsing tutors by category and filters, managing profile, creating and cancelling bookings, and leaving reviews after completed sessions.
- **Tutors**: Maintaining a tutor profile (subject, experience, pricing, availability), managing sessions (bookings), marking sessions complete, and viewing dashboard statistics and reviews.
- **Admins**: Managing users (roles, status, suspension, deletion), viewing analytics, moderating reviews and tutor visibility (featured/availability), and managing categories.

---

## Tech Stack

| Layer     | Technology                             |
| --------- | -------------------------------------- |
| Runtime   | Node.js                                |
| Framework | Express 5                              |
| Language  | TypeScript                             |
| ORM / DB  | Prisma 7 + PostgreSQL                  |
| Auth      | better-auth (email/password, sessions) |
| Email     | Nodemailer                             |
| CORS      | cors                                   |

---

## Features

### Authentication & Authorization

- **Email & password sign-up and sign-in**  
  Users register and log in with email and password. Sessions are managed by better-auth with configurable trusted origins.

- **Email verification**  
  New accounts require email verification. Verification emails are sent via Nodemailer with a link/token; the backend supports the verification flow so only verified users can access protected features.

- **Password reset**  
  Users can request a password reset. The server sends a reset link by email and supports the reset callback; optional confirmation emails are sent after a successful reset.

- **Role-based access**  
  Every user has a **role** (`STUDENT`, `TUTOR`, or `ADMIN`) and a **status** (`ACTIVE`, `INACTIVE`, `SUSPENDED`). Student and tutor routes enforce the corresponding role; admin routes require the `ADMIN` role. Middleware checks authentication and role before allowing access.

- **Centralized error handling**  
  Controllers use a shared async handler and HTTP error helpers. API responses use a consistent shape: `{ success, data? }` for success and `{ success: false, error: { code, message } }` for errors, with appropriate status codes (e.g. 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).

---

### Student Features

- **Profile management**  
  Students have a profile linked to their user account. They can create (upsert), read, and update their profile with:
  - **Class** – current class/grade
  - **Institute** – school or institution name
  - **Address** – physical address
  - **Phone** – contact number
  - **Profile picture** – optional image URL
  - **Bio** – short description
  - **Group** – study stream: `NONE`, `SCIENCE`, `HUMANITIES`, or `BUSINESS_STUDIES`

  The “my profile” endpoint returns the profile plus recent bookings and reviews for a quick dashboard view.

- **Browse tutors**  
  Students can browse tutors with pagination and filters:
  - **Search** – by tutor subject or tutor name (case-insensitive)
  - **Category** – filter by category ID (e.g. “Mathematics”, “Physics”)
  - **Group** – filter by study group (Science, Humanities, Business Studies)
  - **Price range** – min/max price per day
  - **Availability** – only tutors currently available for booking
  - **Featured** – only tutors marked as featured by admins

  Results include the tutor’s user info, category, average rating, and review count.

- **Tutor details**  
  A single-tutor endpoint returns full tutor profile, category, recent reviews (with student and booking info), and recent bookings. Used for tutor profile pages before booking.

- **Categories**  
  Students can list all categories (with names and subject lists). Categories are used to filter tutors and display subject areas.

- **Bookings**
  - **Create booking** – Student selects a tutor, date, time, duration, and optional notes. The tutor must exist and be available; the student must have a profile. Bookings are created with status `CONFIRMED`.
  - **List my bookings** – Paginated list with optional filters: status (`CONFIRMED`, `COMPLETED`, `CANCELLED`), date range (from/to).
  - **Get single booking** – Fetch one booking by ID (only own bookings).
  - **Cancel booking** – Cancel a confirmed booking (status set to `CANCELLED`). Only confirmed bookings can be cancelled.

- **Reviews**
  - **Create review** – After a booking is marked **completed** by the tutor, the student can submit a review (rating and optional comment). One review per booking; duplicate reviews are rejected.
  - **List my reviews** – Paginated list of all reviews written by the student, with tutor and booking details.

---

### Tutor Features

- **Profile management**  
  Tutors have a dedicated profile with:
  - **Subject** – subject(s) they teach
  - **Experience** – years of experience (number)
  - **Address**, **phone**, **profile picture**, **bio**
  - **Institute** – optional institution name
  - **Group** – study group they support (Science, Humanities, Business Studies)
  - **Category** – link to a category (e.g. Mathematics)
  - **Price per day** – fee
  - **Featured** – boolean (set by admin)
  - **Available** – boolean; when false, students cannot create new bookings

  Tutors can create (upsert), read, and update their profile. The “my profile” endpoint includes recent bookings and reviews and computed average rating.

- **Availability**  
  Tutors can update their availability via a dedicated endpoint:
  - **isAvailable** – turn bookings on/off
  - **availableFrom** / **availableTo** – optional date range for availability

  This allows tutors to block or open slots without deleting their profile.

- **Sessions (bookings)**  
  Tutors see their incoming bookings as “sessions”:
  - **List sessions** – Paginated list with filters: status, date range, and student search (by student name or email).
  - **Get session** – Fetch one booking/session by ID.
  - **Mark completed** – Change a confirmed booking to `COMPLETED`. Only confirmed sessions can be marked completed; after this, the student can leave a review.

- **Reviews**  
  Tutors can list reviews received for their profile, with pagination and optional rating range (min/max). Each review includes student and booking info.

- **Dashboard**  
  A dashboard endpoint returns aggregated stats for the logged-in tutor:
  - Total, confirmed, completed, and cancelled session counts
  - Average rating and total review count

  Useful for a tutor dashboard or summary cards.

- **Categories**  
  Tutors can list categories (e.g. when creating/editing profile to choose a category).

---

### Admin Features

- **User management**
  - **List users** – Paginated list with filters: search (name/email), role, status, email verified, creation date range.
  - **Get user** – Full user details including linked student/tutor profile, sessions, and accounts.
  - **Set role** – Change a user’s role (STUDENT, TUTOR, ADMIN).
  - **Set status** – Set user status (ACTIVE, INACTIVE, SUSPENDED).
  - **Suspend / Activate** – Convenience endpoints to set status to SUSPENDED or ACTIVE.
  - **Delete user** – Hard delete user (and cascaded student/tutor, bookings, reviews, sessions, accounts). Used for GDPR-style removal or abuse cases.

- **Analytics**  
  An analytics endpoint returns dashboard-style metrics for a given date range (default: last 30 days):
  - **Totals** – users, students, tutors, categories, bookings, reviews
  - **Users** – counts by role and by status
  - **Bookings** – counts by status; bookings per day (time series)
  - **Reviews** – average rating and total count
  - **Top tutors** – tutors ranked by average rating and review count (configurable limit)

  Supports custom `from`, `to`, and `topTutorsLimit` query parameters.

- **Review moderation**
  - **List reviews** – Paginated list with filters: tutor, student, rating range, creation date range.
  - **Delete review** – Remove a review by ID (e.g. for policy violations).

- **Tutor moderation**
  - **Set tutor featured** – Mark a tutor as featured or not (used for homepage or “featured tutors” list).
  - **Set tutor availability** – Override a tutor’s availability and optional date range (e.g. for support or disputes).

- **Categories**  
  Admins can create, update, and delete categories (name and list of subjects). Deletion is blocked if any tutor is still assigned to that category.

---

## API Overview

| Base path           | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `/api/auth/*`       | better-auth handlers (sign-in, sign-up, sign-out, verification, password reset) |
| `/api/v1/student/*` | Student profile, browse tutors, categories, bookings, reviews                   |
| `/api/v1/tutor/*`   | Tutor profile, availability, sessions, reviews, dashboard, categories           |
| `/api/v1/admin/*`   | Users, analytics, reviews, tutors (featured/availability), categories           |

- **Public (no auth)**
  - `GET /api/v1/student/tutors` – browse tutors
  - `GET /api/v1/student/tutors/:id` – tutor details
  - `GET /api/v1/student/categories` – list categories

- **Protected**  
  All other `/api/v1/student/*`, `/api/v1/tutor/*`, and `/api/v1/admin/*` routes require a valid session; student/tutor routes also require the matching role; admin routes require `ADMIN` role.

---

## Getting Started

1. **Clone and install**

   ```bash
   git clone https://github.com/TalhaShahidKhan/skill_bridge_backend.git
   cd skill_bridge_backend
   npm install
   ```

2. **Database**
   - Create a PostgreSQL database and set its URL in `.env` (see [Environment](#environment)).
   - Run migrations:  
     `npx prisma migrate deploy`  
     (or `npx prisma migrate dev` during development.)

3. **Environment**
   - Copy `.env.example` to `.env` (if present) or create `.env` with the required variables (see [Environment](#environment)).

4. **Run**
   - Development: `npm run dev` (uses `tsx watch` on `src/server.ts`).
   - Production: `npm run build` then `npm start`.

5. **Optional: seed admin**
   - `npm run seedAdmin` – seeds an initial admin user (script: `src/scripts/seedAdmin.ts`).

---

## Deploy on Vercel

The API can run on Vercel as a serverless function. The repo includes `vercel.json` and `api/index.ts` for this.

### 1. Prerequisites

- A **PostgreSQL** database (e.g. [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com), or Railway).
- Your database **migrations** applied (run `npx prisma migrate deploy` against the production DB before or after first deploy).

### 2. Push code to GitHub

Ensure your project is in a Git repo and pushed to GitHub (or another [supported Git provider](https://vercel.com/docs/concepts/git)).

### 3. Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New…** → **Project**.
3. Import your **skill_bridge_backend** repository.
4. Leave **Framework Preset** as “Other” (or “Vercel” default); the `vercel.json` and `api/` setup will be used.

### 4. Set environment variables

In the Vercel project: **Settings** → **Environment Variables**. Add at least:

| Variable       | Description                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/db?sslmode=require`). |
| `APP_URL`      | Frontend URL for CORS and auth (e.g. `https://your-app.vercel.app` or your custom domain). |

Add any others your app uses (e.g. email: `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, etc.) for the same environments (Production, Preview, Development) you need.

### 5. Deploy

Click **Deploy**. Vercel will:

- Run `npm install` (and thus `postinstall` → `prisma generate`).
- Build the serverless function from `api/index.ts` with `@vercel/node`.
- Route all requests to that function via the `routes` in `vercel.json`.

Your API will be available at:

- **Production**: `https://<your-project>.vercel.app`
- **Preview**: each branch/PR gets its own URL.

### 6. After first deploy (migrations)

If you didn’t run migrations earlier, run them from your machine against the production DB:

```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

(Or use a one-off script/CI step with the same `DATABASE_URL`.)

### Notes

- **Cold starts**: Serverless functions may have a short delay on first request; subsequent requests are faster.
- **Database connections**: For high traffic, consider connection pooling (e.g. [Prisma Data Proxy](https://www.prisma.io/docs/guides/prisma-data-platform/data-proxy) or a pooled DB URL from your provider).
- **CORS**: Set `APP_URL` in Vercel to your frontend origin so auth and API calls work from the browser.

---

## Environment

Typical variables:

- **Database** – `DATABASE_URL` (PostgreSQL connection string).
- **App** – `APP_URL` (frontend/origin for CORS and auth links), `PORT` (server port, default 3000).
- **Auth** – Trusted origins and any better-auth options (e.g. via `APP_URL`).
- **Email** – Nodemailer configuration (e.g. `EMAIL_HOST_USER`, and host/port/password as required by your provider) for verification and password-reset emails.

---

## Scripts

| Script        | Command                            | Description                                       |
| ------------- | ---------------------------------- | ------------------------------------------------- |
| `dev`         | `npx tsx watch src/server.ts`      | Run server in development with hot reload         |
| `build`       | `tsc`                              | Compile TypeScript to `dist/`                     |
| `start`       | `node dist/index.js`               | Run compiled app (adjust if entry is `server.js`) |
| `postinstall` | `prisma generate`                  | Generate Prisma client after install              |
| `seedAdmin`   | `npx tsx src/scripts/seedAdmin.ts` | Seed an admin user                                |

---

## Data Model

- **User** – Core account (id, name, email, emailVerified, image, role, status). Linked to **Session** and **Account** (better-auth), and optionally to **Student** or **Tutor**.
- **Student** – One per user; class, institute, address, phone, profilePic, bio, group. Has many **Booking** and **Review**.
- **Tutor** – One per user; subject, experience, category, address, phone, profilePic, bio, institute, group, pricePerDay, isFeatured, isAvailable, availableFrom/To. Has many **Booking** and **Review**.
- **Category** – name, subjects[]; many tutors per category.
- **Booking** – student, tutor, date, time, duration, status (CONFIRMED | COMPLETED | CANCELLED), notes. Optional one **Review** per booking after completion.
- **Review** – student, tutor, booking, rating, comment.

Study **Group** enum: `NONE`, `SCIENCE`, `HUMANITIES`, `BUSINESS_STUDIES`.

---

## License

ISC

---

<p align="center">
  <strong>Skill Bridge</strong> — Bridging knowledge and growth through learning.
</p>
