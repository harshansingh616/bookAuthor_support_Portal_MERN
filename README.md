# BookLeaf Author Support & Communication Portal

A full-stack web app that helps BookLeaf handle author support tickets at scale with:
- Author portal (books + tickets)
- Admin portal (ticket queue + ticket management)
- AI-assisted triage + AI-drafted replies (Groq)
- Near real-time updates (SSE)

---

## Live Demo
- Frontend (Vercel): `book-author-support-portal-mern.vercel.app`
- Backend (Render): `https://bookauthor-support-portal-mern.onrender.com`

---

## Test Login Credentials

### Admin
- Email: `admin@bookleaf.test`
- Password: `Admin@12345`

### Authors
Use any author email from the seeded dataset (examples):
- `priya.sharma@email.com`
- `rohit.kapoor@email.com`
- `ananya.reddy@email.com`

Password (for all authors): `Author@12345`

---

## Tech Stack
- Frontend: React (Vite) + React Router DOM + Bootstrap
- Backend: Node.js + Express
- Database: MongoDB Atlas (Mongoose)
- Auth: JWT
- Validation: Zod
- Real-time: Server-Sent Events (SSE)
- AI: Groq (OpenAI-compatible chat completions API)

---

## Local Setup

### 1) Prerequisites
- Node.js 18+
- MongoDB Atlas cluster

### 2) Backend setup

`cd server
npm install`


- Create server/.env:

`PORT=5050
MONGO_URI=<your_mongodb_atlas_uri>
JWT_SECRET=<your_long_random_secret>`

##### Optional (AI). App works without AI if these are missing.
`GROQ_API_KEY=<your_groq_api_key>`
`GROQ_MODEL=llama-3.1-8b-instant`

- Seed DB with provided dataset:

`npm run seed`

- Start backend:

`npm run dev`

- Health check:

`curl http://localhost:5050/api/health`

### 3) Frontend setup
`cd ../client`
`npm install`

- Create client/.env:

`VITE_API_BASE_URL=http://localhost:5050`

- Start frontend:

`npm run dev`

## Open:

`http://localhost:5173`

---------

# Architecture Decisions (and Why)

### Backend layering (clean separation)

**Flow:** `Routes → Middleware → Controllers → Services → Models`

- **Routes:** only URL wiring (no business logic)
- **Middleware:** cross-cutting concerns (auth, RBAC, validation, error handler)
- **Controllers:** HTTP in/out only (`req → service → res`)
- **Services:** business logic + DB queries + SSE publish + AI calls
- **Models:** Mongoose schemas

**Why:** This structure keeps code readable, testable, and easy to explain. Services can be unit-tested independently from Express.

---

### Role-based access control (RBAC)

- **Authors** can only access their own books/tickets by scoping queries using `authorRef`.
- **Admins** can access all tickets and manage them.

**Why:** Prevents data leakage and matches assignment requirements.

---

### Real-time updates with SSE

- Authors connect to: `GET /api/tickets/stream`
- Server pushes events:
  - `ticket.created`
  - `ticket.updated`
  - `ticket.message.created`

**Why SSE (vs WebSockets):**
- Requirement is “real-time or near-real-time” updates.
- This use case is mainly **server → client** updates, so SSE is simpler and reliable.
- In production (multi-instance), the SSE hub would be backed by Redis pub/sub.

**Note:** `EventSource` cannot send `Authorization` headers, so the browser stream uses `?token=<jwt>`.  
Request logging omits query strings to avoid leaking tokens.

---

## AI Integration (Groq)

### What AI does
- **Auto-classification** (category) on ticket creation
- **Auto-priority** (Critical / High / Medium / Low) on ticket creation
- **AI-drafted response** when admin opens a ticket

Admins can override category/priority and edit the draft before sending.

---

### Prompt strategy

**Triage prompt**
- Returns strict JSON: `{ "category": "...", "priority": "...", "rationale": "..." }`
- Uses clear category list + priority rules
- Low temperature to improve consistency

**Draft prompt**
- Uses a BookLeaf tone guide: empathetic, specific, clear timeline, clear next step
- Uses **Knowledge Base slicing**: only the relevant policy snippet is included based on the ticket category
- Includes minimal ticket + (optional) book snapshot + author info

---

### Output validation (important)

AI responses are validated with **Zod** even after the model returns JSON.  
**Why:** Prevents malformed AI output from breaking the API.

---

### Error handling / graceful degradation

AI calls are **best-effort**:
- Ticket creation always succeeds even if AI fails.

If AI is down / rate-limited:
- Ticket defaults remain: `category = General Inquiry`, `priority = Medium`
- Admin can respond manually
- Admin UI shows a warning if draft generation fails

---

### Cost management
- AI triage runs once per ticket creation.
- AI draft is generated only when needed (admin opens ticket) and cached per ticket unless **Force Regenerate** is used.
- Knowledge base is not sent fully on every call; only the relevant snippet is included.
