# SkillBridge 🎓

**"Connect with Expert Tutors, Learn Anything"**

---

## Project Overview

SkillBridge is a full-stack web application that connects learners with expert tutors. Students can browse tutor profiles, view availability, and book sessions instantly. Tutors can manage their profiles, set availability, and track their teaching sessions. Admins oversee the platform and manage users.

---

## Roles & Permissions

| Role        | Description                         | Key Permissions                                                  |
| ----------- | ----------------------------------- | ---------------------------------------------------------------- |
| **Student** | Learners who book tutoring sessions | Browse tutors, book sessions, leave reviews, manage profile      |
| **Tutor**   | Experts who offer tutoring services | Create profile, set availability, view bookings, manage subjects |
| **Admin**   | Platform moderators                 | Manage all users, view analytics, moderate content               |

> 💡 **Note**: Users select their role during registration.Admin accounts should be seeded in the database.

---

## Tech Stack

🛠️ **See [README.md](./README.md#-tech-stack) for complete technology specifications.**

---

## Features

### Public Features

- Browse and search tutors by subject, rating, and price
- Filter tutors by category
- View detailed tutor profiles with reviews
- Landing page with featured tutors

### Student Features

- Register and login as student
- Book tutoring sessions
- View upcoming and past bookings
- Leave reviews after sessions
- Manage profile

### Tutor Features

- Register and login as tutor
- Create and update tutor profile
- Set availability slots
- View teaching sessions
- See ratings and reviews

### Admin Features

- View all users (students and tutors)
- Manage user status (ban/unban)
- View all bookings
- Manage categories

---

## Pages & Routes

> ⚠️ **Note**: These routes are examples. You may add, edit, or remove routes based on your implementation needs.

### Public Routes

| Route         | Page          | Description                   |
| ------------- | ------------- | ----------------------------- |
| `/`           | Home          | Hero, search, featured tutors |
| `/tutors`     | Browse Tutors | List with filters             |
| `/tutors/:id` | Tutor Profile | Details, reviews, book        |
| `/login`      | Login         | Login form                    |
| `/register`   | Register      | Registration form             |

### Student Routes (Private)

| Route                 | Page        | Description        |
| --------------------- | ----------- | ------------------ |
| `/dashboard`          | Dashboard   | Overview, bookings |
| `/dashboard/bookings` | My Bookings | Booking history    |
| `/dashboard/profile`  | Profile     | Edit info          |

### Tutor Routes (Private)

| Route                 | Page         | Description     |
| --------------------- | ------------ | --------------- |
| `/tutor/dashboard`    | Dashboard    | Sessions, stats |
| `/tutor/availability` | Availability | Set time slots  |
| `/tutor/profile`      | Profile      | Edit tutor info |

### Admin Routes (Private)

| Route               | Page       | Description       |
| ------------------- | ---------- | ----------------- |
| `/admin`            | Dashboard  | Statistics        |
| `/admin/users`      | Users      | Manage users      |
| `/admin/bookings`   | Bookings   | All bookings      |
| `/admin/categories` | Categories | Manage categories |

---

## Database Tables

Design your own schema for the following tables:

- **Users** - Store user information and authentication details
- **TutorProfiles** - Tutor-specific information (linked to Users)
- **Categories** - Subject categories for tutoring
- **Bookings** - Session bookings between students and tutors
- **Reviews** - Student reviews for tutors

> 💡 _Think about what fields each table needs based on the features above._

---

## API Endpoints

> ⚠️ **Note**: These endpoints are examples. You may add, edit, or remove endpoints based on your implementation needs.

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login user        |
| GET    | `/api/auth/me`       | Get current user  |

### Tutors (Public)

| Method | Endpoint          | Description                 |
| ------ | ----------------- | --------------------------- |
| GET    | `/api/tutors`     | Get all tutors with filters |
| GET    | `/api/tutors/:id` | Get tutor details           |
| GET    | `/api/categories` | Get all categories          |

### Bookings

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| POST   | `/api/bookings`     | Create new booking  |
| GET    | `/api/bookings`     | Get user's bookings |
| GET    | `/api/bookings/:id` | Get booking details |

### Tutor Management

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| PUT    | `/api/tutor/profile`      | Update tutor profile |
| PUT    | `/api/tutor/availability` | Update availability  |

### Reviews

| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| POST   | `/api/reviews` | Create review |

### Admin

| Method | Endpoint               | Description        |
| ------ | ---------------------- | ------------------ |
| GET    | `/api/admin/users`     | Get all users      |
| PATCH  | `/api/admin/users/:id` | Update user status |

---

## Flow Diagrams

### 👨‍🎓 Student Journey

```
                              ┌──────────────┐
                              │   Register   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │Browse Tutors │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ View Profile │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Book Session │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │    Attend    │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Leave Review │
                              └──────────────┘
```

### 👨‍🏫 Tutor Journey

```
                              ┌──────────────┐
                              │   Register   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │Create Profile│
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │    Set       │
                              │ Availability │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │View Sessions │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │Mark Complete │
                              └──────────────┘
```

### 📊 Booking Status

```
                              ┌──────────────┐
                              │  CONFIRMED   │
                              │   (instant)  │
                              └──────────────┘
                               /            \
                              /              \
                       (tutor)          (student)
                        marks            cancels
                            /                \
                           ▼                  ▼
                   ┌──────────────┐   ┌──────────────┐
                   │  COMPLETED   │   │  CANCELLED   │
                   └──────────────┘   └──────────────┘
```

---

## Submission

📋 **See [README.md](./requirement.md) for submission guidelines, timeline, and marks.**
