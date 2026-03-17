# BookLeaf Author Support & Communication Portal

A full-stack web app (React + Express + MongoDB Atlas) to manage author support tickets with AI-assisted triage and response drafting.

## Tech Stack
- Frontend: React (Vite) + React Router DOM + Bootstrap
- Backend: Node.js + Express
- DB: MongoDB Atlas (Mongoose)
- Auth: JWT
- Validation: Zod
- Realtime: Server-Sent Events (SSE)
- AI: Groq (OpenAI-compatible chat completions)

---

## Features

### Author Portal
- Login (email/password)
- My Books (royalties, status, sales, etc.)
- Create Support Ticket (book-specific or general)
- My Tickets (list + detail)
- Realtime updates (admin replies appear without refresh via SSE)

### Admin Portal
- Ticket Queue with filters (status/category/priority/date/search)
- Urgent tickets prioritized by backend sorting (unresolved → priority → oldest)
- Ticket detail: conversation + status/category/priority updates + internal notes + assign to self
- AI draft reply (editable)
- AI triage (auto category + priority on ticket creation, admin can override)

---

## Architecture (Interview Explanation)
This project uses a clean separation of concerns:

- **Routes**: only URL mapping (no business logic)
- **Middleware**: cross-cutting concerns (auth, role-based access, validation, error handling)
- **Controllers**: HTTP-only (req → service → res)
- **Services**: business logic + database access + SSE publish + AI calls
- **Models**: Mongoose schemas
- **AI Layer**: Groq client + prompt strategy + Zod validation of AI outputs
- **Realtime Layer**: SSE hub (in-memory pub/sub for this assignment)

Why this approach:
- Easier to test services
- Easier to reason about during interview
- Scales better than putting logic inside routes

---

## Local Setup

### 1) Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (URI stored in `.env` only)

### 2) Backend setup

cd server
npm install

Create server/.env:

PORT=5050
MONGO_URI=your_mongodb_atlas_uri_here
JWT_SECRET=your_long_random_secret

# Optional AI (app works without these)
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant

Seed database (loads provided JSON dataset into Atlas):

npm run seed

Start backend:

npm run dev

Backend runs at:

http://localhost:5050

### 3) Frontend setup
cd ../client
npm install

Create client/.env:

VITE_API_BASE_URL=http://localhost:5050

Start frontend:

npm run dev

Frontend runs at:

http://localhost:5173