const fetch = require("node-fetch");
const { env } = require("../config/env");
const { HttpError } = require("../utils/httpError");

async function groqChatCompletion({ messages, responseFormat, maxCompletionTokens = 512, temperature = 0 }) {
  if (!env.groqApiKey) {
    throw new HttpError(503, "AI not configured (missing GROQ_API_KEY)");
  }

  const url = `${env.groqBaseUrl}/chat/completions`;

  const body = {
    model: env.groqModel,
    messages,
    temperature,
    max_completion_tokens: maxCompletionTokens,
  };

  // Groq supports OpenAI-style response_format (json_object/json_schema). :contentReference[oaicite:1]{index=1}
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error?.message || `Groq request failed (${res.status})`;
      throw new HttpError(503, msg);
    }

    const content = data?.choices?.[0]?.message?.content || "";
    return {
      content,
      usage: data?.usage || null,
      model: data?.model || env.groqModel,
    };
  } catch (err) {
    if (err.name === "AbortError") throw new HttpError(503, "AI timeout (try again)");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { groqChatCompletion };