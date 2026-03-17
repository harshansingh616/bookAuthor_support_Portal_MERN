const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const env = {
  port: Number(process.env.PORT || 5050),
  mongoUri: requireEnv("MONGO_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),

  
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  groqBaseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
};

module.exports = { env };