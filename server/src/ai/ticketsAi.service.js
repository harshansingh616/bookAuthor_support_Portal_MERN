const { z } = require("zod");
const { groqChatCompletion } = require("./groqClient");
const { CATEGORIES, PRIORITIES, kbForCategory } = require("./bookleafKb");

const triageSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  rationale: z.string().max(250).optional(),
});

const draftSchema = z.object({
  draft: z.string().min(10),
});

async function triageTicket({ subject, description }) {
  const system = `
You are BookLeaf Support Triage.
Classify the ticket into one category and one priority.

Categories (choose exactly one, must match text exactly):
- Royalty & Payments
- ISBN & Metadata Issues
- Printing & Quality
- Distribution & Availability
- Book Status & Production Updates
- General Inquiry

Priority rules (choose exactly one):
- Critical: revenue/payment blocked for long time, serious ISBN mismatch, legal/urgent escalation, repeated unresolved issue
- High: missing royalties (months), ISBN error, severe quality issue, book unavailable widely
- Medium: normal questions, minor delays, updates
- Low: small metadata questions like author bio, description tweaks

Return ONLY valid JSON with keys:
{ "category": "...", "priority": "...", "rationale": "one short sentence" }
`.trim();

  const user = `
Subject: ${subject}
Description: ${description}
`.trim();

  const result = await groqChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    responseFormat: { type: "json_object" },
    maxCompletionTokens: 200,
    temperature: 0,
  });

  const parsed = triageSchema.parse(JSON.parse(result.content));
  return { ...parsed, _meta: { model: result.model, usage: result.usage } };
}

async function draftAdminReply({ ticket, author, book }) {
  const kb = kbForCategory(ticket.category);

  const system = `
You are a BookLeaf support representative writing a draft reply to an author.
Use ONLY the policies in the provided Knowledge Base.
Do NOT invent facts or numbers. If missing, ask for the minimum info needed.
Be empathetic. Include timelines (24–48h / 48h / 5–7 days / 7–10 days) when relevant.
End with a clear next step.

Return ONLY JSON:
{ "draft": "..." }
`.trim();

  const context = {
    author: {
      name: author?.name || "",
      email: author?.email || "",
      externalAuthorId: author?.externalAuthorId || "",
    },
    book: book || null,
    ticket: {
      id: String(ticket._id),
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      category: ticket.category,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    },
  };

  const user = `
Knowledge Base:
${kb}

Ticket Context (JSON):
${JSON.stringify(context, null, 2)}
`.trim();

  const result = await groqChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    responseFormat: { type: "json_object" },
    maxCompletionTokens: 450,
    temperature: 0.2,
  });

  const parsed = draftSchema.parse(JSON.parse(result.content));
  return { ...parsed, _meta: { model: result.model, usage: result.usage } };
}

module.exports = { triageTicket, draftAdminReply };