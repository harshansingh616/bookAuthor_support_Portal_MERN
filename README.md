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