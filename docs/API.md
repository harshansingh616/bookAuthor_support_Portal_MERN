# API Documentation (REST)

Base URL (local): `http://localhost:5050`

Auth:
- Use `Authorization: Bearer <JWT>`
- For SSE in browser: `/api/tickets/stream?token=<JWT>`

---

## Health
### GET `/api/health`
Response:
```json
{ "ok": true }

Auth
POST /api/auth/login

Body:

{ "email": "priya.sharma@email.com", "password": "Author@12345" }

Response:

{ "token": "...", "user": { "id": "...", "email": "...", "role": "author", "name": "..." } }
GET /api/auth/me

Header: Authorization: Bearer <token>
Response:

{ "user": { "id": "...", "email": "...", "role": "...", "name": "...", "authorRef": "..." } }
Books (Author)
GET /api/books/my

Header: Authorization: Bearer <author token>
Response:

{ "books": [ ... ] }
Tickets (Author)
POST /api/tickets

Header: Authorization: Bearer <author token>
Body:

{
  "bookExternalId": "BK001",
  "subject": "ISBN mismatch",
  "description": "Amazon is showing a different ISBN..."
}

Response:

{ "id": "<ticketId>" }
GET /api/tickets/my

Header: Authorization: Bearer <author token>
Response:

{ "tickets": [ ... ] }
GET /api/tickets/my/:ticketId

Header: Authorization: Bearer <author token>
Response:

{ "ticket": { ... }, "messages": [ ... ] }
GET /api/tickets/stream

SSE stream.

curl: send Authorization header

browser: use query token
Events:

connected

ticket.created

ticket.updated

ticket.message.created

Tickets (Admin)
GET /api/admin/tickets

Header: Authorization: Bearer <admin token>
Query params (optional):

status, category, priority, from, to, q

Response:

{ "tickets": [ ... ] }
GET /api/admin/tickets/:ticketId

Header: Authorization: Bearer <admin token>
Response:

{ "ticket": { ... }, "messages": [ ... ] }
PATCH /api/admin/tickets/:ticketId

Header: Authorization: Bearer <admin token>
Body (any subset):

{
  "status": "In Progress",
  "category": "Royalty & Payments",
  "priority": "High",
  "internalNotes": "Investigating with finance team",
  "assigneeUserId": "..."
}
POST /api/admin/tickets/:ticketId/reply

Header: Authorization: Bearer <admin token>
Body:

{ "message": "Thanks for flagging this..." }
GET /api/admin/tickets/:ticketId/draft

Header: Authorization: Bearer <admin token>
Query (optional):

force=1 (regenerate draft even if cached)
Response:

{ "draft": "...", "cached": true, "model": "..." }