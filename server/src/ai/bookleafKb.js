const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

// Cost-aware: we send only the relevant KB snippet (not the entire doc).
function kbForCategory(category) {
  const commonTone = `
Tone:
- Be empathetic + professional.
- Be specific with dates/statuses/numbers ONLY if provided in context.
- If BookLeaf is at fault, own it directly.
- If investigation needed, give a clear timeline (usually 48 hours).
- End with clear next step.
`.trim();

  const company = `
Company facts:
- BookLeaf self-publishing (India + US). Delhi printing/warehouse.
- Packages: Standard Free, Bestseller Breakthrough.
- We handle cover, typesetting, ISBN, printing, distribution, royalty management.
`.trim();

  const policies = {
    "Royalty & Payments": `
Royalty policy:
- 80/20 split: 80% of net profit to author.
- Net profit = MRP - printing - platform commission - shipping.
- Royalties calculated quarterly; paid within 45 days after quarter end.
- Minimum payout threshold ₹1,000; else rolls over.
- Payout via bank transfer linked in dashboard.
`.trim(),

    "ISBN & Metadata Issues": `
ISBN policy:
- BookLeaf assigns unique ISBN; registered under BookLeaf imprint.
- If ISBN error (duplicate/wrong linking) => HIGH priority, escalate to production team.
- Provide a 48-hour investigation/resolution timeline.
`.trim(),

    "Printing & Quality": `
Printing & quality:
- Standard print turnaround 5–7 business days from order confirmation.
- If quality issue (misprint/binding/color), arrange free reprint after verification.
- Ask author to share photos of defective copy.
`.trim(),

    "Distribution & Availability": `
Distribution:
- Listings on Amazon India/US/UK, Flipkart, BookLeaf Store.
- New listings go live 7–10 business days after publication complete.
- If “Unavailable”, usually stock sync issue; re-sync in 24–48 hours.
`.trim(),

    "Book Status & Production Updates": `
Production stages:
Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live
Delays often: Cover Design (approval) and Proofreading (revision rounds).
`.trim(),

    "General Inquiry": `
General support:
- Metadata updates (description/bio) can be submitted via dashboard or email.
- Platform updates usually reflect in 3–5 business days.
`.trim(),
  };

  const chosen = policies[category] || policies["General Inquiry"];

  return [company, chosen, commonTone].join("\n\n");
}

module.exports = { CATEGORIES, PRIORITIES, kbForCategory };