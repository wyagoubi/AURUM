
## Setup & Development

1. **Clone the repository**  
   ```bash
   git clone https://github.com/wyagoubi/AURUM.git
   cd AURUM حجوزات الضيف



---

## 2. Backend README.md (for the `aurum-backend` repository)

```markdown
# AURUM Backend – Node.js + Express + PostgreSQL REST API

This is the backend REST API for the **AURUM** hotel booking platform.  
It handles user authentication, hotel & room management, bookings, analytics, and AI concierge communication.

## Live API Base URL
[**https://aurum-m4v8.onrender.com/api**](https://aurum-m4v8.onrender.com/api)  
Health check: [https://aurum-m4v8.onrender.com/api/healthz](https://aurum-m4v8.onrender.com/api/healthz)

## Features

- **Dual‑Mode Authentication**  
  – Server‑side sessions stored in PostgreSQL (`connect-pg-simple`) with `SameSite=none; Secure` cookies.  
  – Fallback HMAC‑signed tokens for API clients (stored in `localStorage`).

- **Hotel & Room Management**  
  – CRUD operations for hotels and rooms (owner‑protected).  
  – Automatic seeding of 12 luxury hotels with 4 room types each on first run.

- **Booking System**  
  – Create, view, and cancel bookings.  
  – Cancel reason (optional) stored in `cancel_reason` column.  
  – Past stays cannot be cancelled (server‑side validation).

- **Analytics for Owners**  
  – Aggregated revenue, total bookings, occupancy rate, and average daily rate.  
  – Booking pace (next 30 days) and revenue breakdown by month.

- **AI Concierge**  
  – Proxy to Anthropic Claude API (or OpenAI) with a dynamic system prompt that injects live hotel data.  
  – Returns a natural language reply plus an optional `action` object (SEARCH, BOOK, GO_RESERVATIONS, etc.).

- **Automatic Database Setup**  
  – `initDb.js` creates all tables and seeds hotels/rooms when the database is empty.

## File Structure



aurum-backend/
├── src/
│ ├── index.js # Entry point – starts the server
│ ├── app.js # Express app setup (middleware, session, CORS, routes)
│ ├── db.js # PostgreSQL connection pool
│ ├── initDb.js # Creates tables and seeds initial data (hotels, rooms)
│ ├── auth.js # Password hashing, HMAC token signing/verification, auth middleware
│ └── routes/
│ ├── auth.js # POST /register, POST /login, POST /logout, GET /me
│ ├── hotels.js # GET /hotels, GET /hotels/:id (with Unsplash image mapping)
│ ├── bookings.js # POST /bookings, GET /bookings, POST /bookings/:id/cancel
│ ├── owner.js # POST /owner/properties, GET /owner/properties, DELETE /owner/properties/:id, GET /analytics/dashboard
│ └── ai.js # POST /ai/concierge
├── package.json # Dependencies (express, pg, bcryptjs, openai, express-session, connect-pg-simple, cors, dotenv)
├── .env # Environment variables (not committed)
├── .gitignore # Excludes node_modules, .env, etc.
└── README.md # This file






## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/hotels` | List all active hotels (supports `?q=` and `?city=`) |
| GET    | `/api/hotels/:id` | Get a single hotel with its rooms |
| GET    | `/api/healthz` | Health check |

### Authentication (guests & owners)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/auth/register` | Create a new account (role: `guest` or `owner`) |
| POST   | `/api/auth/login`    | Login, sets a session cookie and returns a signed token |
| POST   | `/api/auth/logout`   | Destroy the session |
| GET    | `/api/auth/me`       | Get the currently authenticated user |

### Bookings (authenticated guests)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/bookings` | Create a new booking |
| GET    | `/api/bookings` | List all bookings of the logged‑in user |
| POST   | `/api/bookings/:id/cancel` | Cancel a booking (optional `reason` in request body) |

### Owner Routes (owner role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/owner/properties` | Add a new hotel with its rooms |
| GET    | `/api/owner/properties` | List all hotels owned by the authenticated owner |
| DELETE | `/api/owner/properties/:id` | Delete a hotel and all its rooms |
| GET    | `/api/analytics/dashboard` | Get aggregated revenue, bookings, occupancy, and booking pace |

### AI Concierge
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/ai/concierge` | Send a chat message (with conversation history) and receive an AI reply plus an optional action |

## Setup for Development

1. **Clone the repository**  
   ```bash
   git clone https://github.com/wyagoubi/aurum-backend.git
   cd aurum-backend

