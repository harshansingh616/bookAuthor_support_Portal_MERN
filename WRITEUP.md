
---

## 2) `WRITEUP.md`

```md
# BookLeaf Portal – Approach & Tradeoffs (1 Page)

## What I prioritised
I prioritised the core ticket workflow and AI integration because they carry the highest evaluation weight:
- A clean REST backend with authentication and RBAC
- Real-time-ish ticket updates so authors see admin replies without refresh
- AI triage (category + priority) and AI drafted responses grounded in the BookLeaf Knowledge Base

## Key architecture decisions
I used a layered backend structure:
- Routes are wiring-only
- Controllers handle only HTTP concerns
- Services contain all business logic + database access + SSE publishing + AI calls
- Models define the DB schema

This separation makes the code easier to explain, maintain, and test.

## Real-time approach
I used Server-Sent Events (SSE) instead of WebSockets:
- The requirement is near-real-time updates (server → client), which SSE fits perfectly.
- SSE is simpler to implement and debug than WebSockets for this use case.
- In production, I would move the SSE hub to Redis pub/sub for multi-instance scaling.

## AI integration approach
I used Groq with an OpenAI-compatible API:
- Triage runs on ticket creation to classify category and priority.
- Draft response is generated when an admin opens the ticket.
- Prompts are structured and return JSON; outputs are validated using Zod.
- Knowledge base is “sliced” (only relevant policy snippet is sent) for cost control.
- Draft results are cached per ticket unless “force regenerate” is used.

## Error handling and graceful degradation
AI is best-effort:
- If AI fails or is not configured, tickets still work end-to-end.
- Admin can respond manually, and the UI clearly shows that AI draft is unavailable.

## Tradeoffs made
- Attachments are UI-only to focus on the core workflow.
- SSE uses a query token for browser compatibility (EventSource limitation). For production, I would use httpOnly cookies or an EventSource polyfill with headers.

## If given more time
- Add pagination + search on ticket messages
- Add file upload support using S3 (presigned URLs)
- Add audit logs (who changed status/priority/category and when)
- Add production-grade realtime with Redis pub/sub