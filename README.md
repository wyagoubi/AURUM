# AURUM — Luxury Hotel Booking Platform

> *"Where Luxury Finds You"*

AURUM is a full-stack luxury hotel booking platform designed as a university software engineering project. It combines modern web technologies with relational database principles to deliver an end-to-end reservation system. The application supports guest reservations, hotel owner management tools, and AI-assisted customer interaction.

Its architecture consists of a client-side web interface, a RESTful application layer, and a PostgreSQL database structured through SQL schema definitions and automated initialization scripts (initDb.js), ensuring scalability, consistency, and deployment automation.


One challenge we faced was deploying the backend server using Render’s free plan. On the free plan, Render automatically puts the server to sleep after 15 minutes of inactivity. When a new request is made, the server needs around 30–60 seconds to wake up again. This sometimes caused delays or temporary messages such as “Authentication required,” especially during the first request.

## 🔗 Live Demo

**[https://wyagoubi.github.io/AURUM/](https://wyagoubi.github.io/AURUM/)**

> The application is fully live. You can register as a guest or owner, search hotels, complete a booking, and chat with the AI concierge.

---

## ✨ Features

### 👤 Guest Features

- **Hotel Search** — Search by destination (city or country), number of rooms, number of children, and nightly budget. Results are fetched from the API and filtered client-side for instant response.

- 
- **Hotel Galleries** — Each hotel has a multi-tab photo gallery (Exterior, Lobby, Rooms, Amenities) using real Unsplash images. Room types also have individual photos.

- 
- **Booking Flow** — A full booking modal lets guests pick check-in/check-out dates, room type, and enter mock payment details with card number validation (Luhn algorithm).

- 
- **My Reservations** — A dedicated page lists all past and upcoming bookings with status badges (Upcoming / In Stay / Past / Cancelled), total cost, and reference number.
- **Countdown Badges** — Each reservation card shows how many days remain until check-in or check-out, updating in real time.

- 
- **1-Day Alerts** — A toast notification fires automatically when check-in or check-out is exactly one day away. Each alert fires only once per booking using `localStorage`.

- 
- **Cancel Reservation** — Guests can cancel upcoming bookings. The cancellation is sent to the API and the local cache is updated instantly — no page reload needed.

- 
- **AI Concierge** — A floating chatbot powered by the Claude/Groq API. The system prompt is built dynamically from live hotel data in the database. The concierge responds in the same language the user writes in and keeps answers to 2–3 sentences.

- 
- **Dark / Light Theme** — A theme toggle switches between a dark luxury palette and a light mode. The preference is saved in `localStorage` and applied on every page.

- 
- **Offline-First Cache** — After a successful API fetch, all bookings are saved to `localStorage`. If the user signs out or loses connectivity, their reservations remain visible from cache.

### 🏨 Owner Features

- **List Property** — A multi-step wizard guides hotel owners through adding a new property: hotel details → room types and prices → amenities → review and submit.

- 
- **Owner Dashboard** — An analytics page displays total revenue, total bookings, occupancy rate, and average nightly rate — all computed server-side from real booking data.

- 
- **Room Status Management** — A visual room grid lets owners mark individual rooms as Available, Occupied, or Under Maintenance.

### ⚙️ Technical Highlights

- **Dual-Mode Authentication** — Session cookies (`HttpOnly`, `SameSite=none`, `Secure=true`) are used for browser clients. A signed HMAC Bearer token (stored in `localStorage`) is used as a fallback for cross-origin or expired-session scenarios. Both are verified by the same `getAuth()` middleware.

- 
- **Cross-Origin Setup** — The frontend (GitHub Pages) and backend (Render.com) are on different domains. CORS is configured to reflect the allowed origin with `credentials: true`. The session cookie is set with `SameSite=none; Secure` to work across domains.

- 
- **Role-Based Access Control** — Every protected route checks `req.auth.role`. Owner-only routes (`/owner/properties`, `/analytics/dashboard`) reject guest tokens with HTTP 403.

- 
- **Auto-Seeding Database** — On every deployment, `initDb.js` creates all tables if they don't exist and seeds 12 sample hotels with rooms, prices, and amenities — no manual SQL needed.

- **I used Node.js for backend logic, but the database is fully designed using SQL. I also provided separate SQL scripts (schema and seed) to comply with relational database requirements

SQL مستعمل لكن بطريقة مدمجة داخل backend + ملفات منفصلة
- 
- **Responsive Design** — Fully responsive across desktop, tablet, and mobile. Mobile navigation uses a slide-in menu. CSS custom properties (`--gold`, `--text`, `--bg`) power both dark and light themes from a single stylesheet.

- 
- **Vanilla JavaScript** — No frontend frameworks. All DOM manipulation, routing between pages, modal management, and API communication is written in plain JavaScript.

---

## 📁 Frontend — File Structure

```
AURUM/  (GitHub Pages — public repository)
│
├── index.html              # Homepage: hero section, search bar, featured
│                           # destinations, hotel results grid, AI concierge widget
│
├── auth.html               # Unified login and register page for both guests
│                           # and hotel owners. Role switching (Guest / Owner)
│                           # changes the visible form fields.
│
├── reservations.html       # Guest reservations list: status badges, countdown
│                           # timers, cancel button, offline cache display.
│
├── owner.html              # Multi-step property listing wizard:
│                           # Step 1 - Hotel info, Step 2 - Rooms,
│                           # Step 3 - Amenities, Step 4 - Review & Submit.
│
├── owner-dashboard.html    # Owner analytics dashboard: revenue card,
│                           # occupancy rate, booking table, room status grid.
│
├── styles.css              # Global stylesheet: CSS variables for dark/light
│                           # themes, navbar, hotel cards, modals, gallery,
│                           # booking form, toast notifications, animations.
│
├── auth.css                # Styles specific to the auth page: role toggle
│                           # tabs, form inputs, password strength indicator.
│
├── reservations.css        # Styles for the reservations page: booking cards,
│                           # status badges, countdown badges, cancel modal.
│
├── owner.css               # Styles for the property wizard: step indicators,
│                           # room type cards, amenity checkboxes.
│
├── owner-dashboard.css     # Styles for the dashboard: metric cards, charts,
│                           # booking table, room status grid.
│
├── app.js                  # Core application logic:
│                           # - Hotel data loading and filtering
│                           # - Search bar with custom dropdowns
│                           # - Hotel card rendering with real Unsplash images
│                           # - Photo gallery (hotel / rooms / amenities tabs)
│                           # - Booking modal (date picker, room selector, payment)
│                           # - AI concierge widget (send/receive messages)
│                           # - Nav auth state (show/hide based on login)
│
├── auth.js                 # Authentication logic:
│                           # - Register and login API calls
│                           # - Save user + token to localStorage
│                           # - Role switching (guest ↔ owner)
│                           # - Theme toggle and persistence
│
├── reservations.js         # Reservations page logic:
│                           # - Fetch bookings from API with Bearer token
│                           # - Render from localStorage cache if offline
│                           # - Countdown and status computation
│                           # - 1-day alert notifications
│                           # - Cancel booking with instant cache update
│
├── owner.js                # Owner wizard logic:
│                           # - Multi-step form navigation
│                           # - Dynamic room type rows (add/remove)
│                           # - Submit hotel + rooms to API
│
├── owner-dashboard.js      # Dashboard logic:
│                           # - Fetch analytics from API
│                           # - Render metric cards and booking table
│                           # - Room status grid with status toggle
│
└── README.md               # This file
```

---

## 📁 Backend — File Structure

```
aurum-backend/  (Render.com — private repository)
│
├── src/
│   │
│   ├── index.js            # Entry point. Starts the HTTP server on
│   │                       # process.env.PORT (set automatically by Render).
│   │
│   ├── app.js              # Express application setup:
│   │                       # - trust proxy (required on Render)
│   │                       # - CORS with credentials and allowed origins
│   │                       # - JSON body parser (2 MB limit)
│   │                       # - Session middleware with PostgreSQL store
│   │                       # - Route mounting under /api
│   │                       # - Health check: GET /api/healthz
│   │
│   ├── db.js               # PostgreSQL connection pool using the `pg` library.
│   │                       # Reads DATABASE_URL from environment. SSL enabled
│   │                       # in production (rejectUnauthorized: false for Render).
│   │
│   ├── auth.js             # Shared authentication utilities:
│   │                       # - hashPassword / verifyPassword (bcryptjs, cost 10)
│   │                       # - signToken / verifyToken (HMAC-SHA256, base64url)
│   │                       # - getAuth(req) — checks session first, then Bearer
│   │                       # - requireAuth / requireOwner middleware
│   │
│   ├── initDb.js           # Database initialisation script (runs before server):
│   │                       # - CREATE TABLE IF NOT EXISTS for all 6 tables
│   │                       # - Seeds 12 sample hotels if the hotels table is empty
│   │                       # - Seeds 4 room types per hotel with tiered pricing
│   │
│   └── routes/
│       │
│       ├── auth.js         # Authentication routes:
│       │                   # POST /api/auth/register — create guest or owner account
│       │                   # POST /api/auth/login    — verify password, start session
│       │                   # POST /api/auth/logout   — destroy session
│       │                   # GET  /api/auth/me       — return current user from session
│       │
│       ├── hotels.js       # Hotel routes:
│       │                   # GET /api/hotels         — list active hotels
│       │                   #   supports ?q= (name/city/country) and ?city= filters
│       │                   # GET /api/hotels/:id     — single hotel with rooms
│       │                   # Each hotel response includes real Unsplash cover image,
│       │                   # gallery photos, and per-room-category images.
│       │
│       ├── bookings.js     # Booking routes (auth required):
│       │                   # POST /api/bookings            — create booking
│       │                   # GET  /api/bookings/me         — list user's bookings
│       │                   # POST /api/bookings/:id/cancel — cancel upcoming booking
│       │                   # Validates dates, prevents past check-in and double cancel.
│       │
│       ├── owner.js        # Owner routes (owner role required):
│       │                   # POST   /api/owner/properties      — create hotel + rooms
│       │                   # GET    /api/owner/properties      — list owner's hotels
│       │                   # DELETE /api/owner/properties/:id  — delete hotel + rooms
│       │                   # GET    /api/analytics/dashboard   — revenue & occupancy
│       │
│       └── ai.js           # AI concierge route:
│                           # POST /api/ai/concierge
│                           # Builds system prompt from live hotel data in DB.
│                           # Forwards request to Groq/OpenAI-compatible API.
│                           # Returns response in same language as user's message.
│                           # Logs conversation to chats table for auth users.
│
├── package.json            # Dependencies: express, pg, bcryptjs, cors,
│                           # express-session, connect-pg-simple, dotenv
│
└── render.yaml             # Render.com deployment config:
                            # build: npm install
                            # start: node src/initDb.js && node src/index.js
```

---

## 🗄️ Database Schema

Six tables are created automatically on first run:

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Guest and owner accounts | `id`, `email`, `password_hash`, `name`, `role` (guest\|owner) |
| `hotels` | Hotel listings | `id`, `owner_id`, `name`, `city`, `stars`, `price_from`, `amenities` (JSONB) |
| `rooms` | Room types per hotel | `id`, `hotel_id`, `category`, `price`, `capacity`, `quantity`, `bed_type` |
| `bookings` | Guest reservations | `id`, `user_id`, `hotel_id`, `check_in`, `check_out`, `total`, `status` |
| `sessions` | Server-side sessions | `sid`, `sess` (JSON), `expire` — managed by connect-pg-simple |
| `chats` | AI conversation log | `id`, `user_id`, `message`, `response` |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create guest or owner account |
| POST | `/api/auth/login` | — | Login and receive session + token |
| POST | `/api/auth/logout` | — | Destroy session |
| GET | `/api/auth/me` | ✓ | Get current authenticated user |
| GET | `/api/hotels` | — | List all active hotels (supports `?q=` and `?city=`) |
| GET | `/api/hotels/:id` | — | Get hotel details with room types and images |
| POST | `/api/bookings` | ✓ | Create a new booking |
| GET | `/api/bookings/me` | ✓ | List current user's bookings |
| POST | `/api/bookings/:id/cancel` | ✓ | Cancel an upcoming booking |
| POST | `/api/owner/properties` | Owner | Create hotel listing with rooms |
| GET | `/api/owner/properties` | Owner | List owner's hotels |
| DELETE | `/api/owner/properties/:id` | Owner | Delete hotel and all its rooms |
| GET | `/api/analytics/dashboard` | Owner | Revenue, occupancy, and booking metrics |
| POST | `/api/ai/concierge` | — | Send message to AI concierge |
| GET | `/api/healthz` | — | Health check |

---

## 🚀 Setup & Deployment

### Frontend — GitHub Pages

1. Create a **public** repository on GitHub and upload all frontend files
2. Go to **Settings → Pages → Source: main branch / root**
3. Open every `.js` file and set the API base URL on the first line:

```js
const API_BASE = 'https://your-backend.onrender.com/api';
```

### Backend — Render.com

1. Push the backend folder to a **private** GitHub repository
2. On Render.com, create a new **Web Service** and connect the repo
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `node src/initDb.js && node src/index.js`
5. Create a **PostgreSQL** database on Render — the `DATABASE_URL` is set automatically

### Environment Variables

| Key | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Render) |
| `SESSION_SECRET` | Long random string for signing session cookies |
| `OPENAI_API_KEY` | API key for Groq or any OpenAI-compatible provider |
| `OPENAI_BASE_URL` | Base URL of the AI provider (e.g. `https://api.groq.com/openai/v1`) |
| `OPENAI_MODEL` | Model name (e.g. `llama-3.1-8b-instant`) |
| `ALLOWED_ORIGINS` | Frontend origin for CORS (e.g. `https://wyagoubi.github.io`) |

---

## 👥 Team — G08

| Member | Role |
|---|---|
| Yagoubi Walaa Hadj Mahmoud Taki Eddine | Frontend-backend integration, CORS & auth, AI concierge, bug fixing |
| Belakhdar Mohamed Yacine | JavaScript logic |
| Abderrahmane Boussekar | HTML structure, CSS styling, responsive design, dark/light theme |
| Guibadj Abdellah Younes Tamim | Node.js backend, Express routes, session management |
| Zidelkheir Hadj | Database schema, SQL queries |

**Teacher:** Dr. Saida Sarra Boudouh — 2025 / 2026
