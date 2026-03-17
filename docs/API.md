# BookLeaf Portal API (REST)

## Live Demo
- Frontend (Vercel): `https://book-author-support-portal-mern.vercel.app`
- Backend (Render): `https://bookauthor-support-portal-mern.onrender.com`

## Base URLs
- Local: `http://localhost:5050`
- Production: `https://bookauthor-support-portal-mern.onrender.com`

---

## Authentication

### JWT Usage
Send JWT token in request headers:

Authorization:

Authorization:` Bearer <JWT>`


### SSE Auth Note (Browser)
`EventSource` cannot send headers, so SSE supports token via query:


GET /api/tickets/stream?token=<JWT>


---

## Health

### GET `/api/health`
**Response**
json
`
{ "ok": true }`
## Auth
### POST /api/auth/login

- Body

`{
  "email": "priya.sharma@email.com",
  "password": "Author@12345"
}`

- Response
`
{
  "token": "JWT_HERE",
  "user": {
    "id": "USER_ID",
    "email": "priya.sharma@email.com",
    "role": "author",
    "name": "Priya Sharma"
  }
}`

### GET /api/auth/me

- Headers

Authorization: `Bearer <JWT>`

- Response
`
{
  "user": {
    "id": "USER_ID",
    "email": "priya.sharma@email.com",
    "role": "author",
    "name": "Priya Sharma",
    "authorRef": "AUTHOR_OBJECT_ID"
  }
}`

## Books (Author)
## GET /api/books/my

- Headers

Authorization: `Bearer <AUTHOR_JWT>`

- Response
`
{
  "books": [
    {
      "_id": "BOOK_OBJECT_ID",
      "externalBookId": "BK001",
      "title": "Whispers of the Ganges",
      "isbn": "978-93-5XXXX-01-1",
      "genre": "Literary Fiction",
      "publicationDate": "2023-06-20T00:00:00.000Z",
      "status": "Published & Live",
      "mrp": 399,
      "totalCopiesSold": 342,
      "totalRoyaltyEarned": 11970,
      "royaltyPaid": 8400,
      "royaltyPending": 3570
    }
  ]
}`

## Tickets (Author)
### POST /api/tickets

Create a new ticket (book-specific or general).

- Headers

Authorization: `Bearer <AUTHOR_JWT>`
Content-Type: `application/json`

- Body (book-specific)
`
{
  "bookExternalId": "BK001",
  "subject": "ISBN mismatch",
  "description": "Amazon is showing a different ISBN than the physical copy. Please fix it urgently."
}`

- Body (general/account-level)
`
{
  "bookExternalId": null,
  "subject": "Royalty not received",
  "description": "I published 4 months ago and haven't received royalty yet."
}`

- Response
`
{ "id": "TICKET_OBJECT_ID" }`
### GET /api/tickets/my

List all tickets created by the logged-in author.

- Headers

Authorization: `Bearer <AUTHOR_JWT>`

- Response
`
{
  "tickets": [
    {
      "_id": "TICKET_OBJECT_ID",
      "subject": "Royalty not received",
      "status": "Open",
      "category": "Royalty & Payments",
      "priority": "High",
      "bookRef": { "externalBookId": "BK001", "title": "Whispers of the Ganges" },
      "createdAt": "2026-03-16T16:00:00.000Z",
      "updatedAt": "2026-03-16T16:01:00.000Z"
    }
  ]
}`

### GET /api/tickets/my/:ticketId

Get ticket + full message thread for the author.

- Headers

Authorization: `Bearer <AUTHOR_JWT>`

- Response
`
{
  "ticket": {
    "_id": "TICKET_OBJECT_ID",
    "subject": "Royalty not received",
    "status": "Open",
    "category": "Royalty & Payments",
    "priority": "High",
    "bookRef": { "externalBookId": "BK001", "title": "Whispers of the Ganges" }
  },
  "messages": [
    {
      "_id": "MSG_ID_1",
      "senderRole": "author",
      "message": "I published 4 months ago and haven't received royalty yet.",
      "createdAt": "2026-03-16T16:00:00.000Z"
    },
    {
      "_id": "MSG_ID_2",
      "senderRole": "admin",
      "message": "Thanks for flagging this. We will check and update within 48 hours.",
      "createdAt": "2026-03-16T16:10:00.000Z"
    }
  ]
}`

## GET /api/tickets/stream

Server-Sent Events stream for author updates.

- **Option A**: `curl (Authorization header)
curl -N -H "Authorization: Bearer <AUTHOR_JWT>" \
  http://localhost:5050/api/tickets/stream`
- **Option B: browser (query token)**
`/api/tickets/stream?token=<AUTHOR_JWT>`

**Events**

`connected`

`ticket.created`

`ticket.updated`

`ticket.message.created`

## Tickets (Admin)
### GET /api/admin/tickets

Admin ticket queue with filters.

- Headers

Authorization: `Bearer <ADMIN_JWT>`

**Query params (optional)**

`status` (Open | In Progress | Resolved | Closed)

`category` (Royalty & Payments | ISBN & Metadata Issues | Printing & Quality | Distribution & Availability | Book Status & Production Updates | General Inquiry)

`priority` (Critical | High | Medium | Low)

`from` (YYYY-MM-DD)

`to` (YYYY-MM-DD)

`q `(search in subject)

**Example**

`GET /api/admin/tickets?status=Open&priority=High&q=royalty`

- Response
`
{
  "tickets": [
    {
      "_id": "TICKET_OBJECT_ID",
      "subject": "Royalty not received",
      "status": "Open",
      "category": "Royalty & Payments",
      "priority": "High",
      "author": {
        "externalAuthorId": "AUTH001",
        "email": "priya.sharma@email.com",
        "name": "Priya Sharma"
      },
      "book": { "externalBookId": "BK001", "title": "Whispers of the Ganges" },
      "createdAt": "2026-03-16T16:00:00.000Z"
    }
  ]
}`

### GET /api/admin/tickets/:ticketId

Admin ticket detail + conversation.

- Headers

Authorization: Bearer <ADMIN_JWT>

- Response
`
{
  "ticket": {
    "_id": "TICKET_OBJECT_ID",
    "subject": "Royalty not received",
    "status": "Open",
    "category": "Royalty & Payments",
    "priority": "High",
    "author": { "externalAuthorId": "AUTH001", "email": "priya.sharma@email.com", "name": "Priya Sharma" },
    "book": { "externalBookId": "BK001", "title": "Whispers of the Ganges" },
    "internalNotes": ""
  },
  "messages": [
    { "_id": "MSG_ID_1", "senderRole": "author", "message": "...", "createdAt": "..." },
    { "_id": "MSG_ID_2", "senderRole": "admin", "message": "...", "createdAt": "..." }
  ]
}`

### PATCH /api/admin/tickets/:ticketId

Update ticket fields (any subset).

- Headers

`Authorization: Bearer <ADMIN_JWT>`
`Content-Type: application/json`

- Body (example)

`{
  "status": "In Progress",
  "category": "Royalty & Payments",
  "priority": "High",
  "internalNotes": "Investigating with finance team",
  "assigneeUserId": "ADMIN_USER_OBJECT_ID"
}`

- Response

`{ "ok": true }
POST /api/admin/tickets/:ticketId/reply`

Send a reply (creates a TicketMessage visible to the author).

- Headers

`Authorization: Bearer <ADMIN_JWT>`
`Content-Type: application/json`

- Body

`{
  "message": "Thanks for flagging this. We will check and update within 48 hours."
}`

- Response

`{ "ok": true }`

### GET /api/admin/tickets/:ticketId/draft

Get AI-drafted response for a ticket (cached unless forced).

- Headers

Authorization: `Bearer <ADMIN_JWT>`

**Query (optional)**

force=1 → regenerate draft even if cached

- Response

`{
  "draft": "AI drafted response text here...",
  "cached": true,
  "model": "llama-3.1-8b-instant"
}`