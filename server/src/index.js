const { env } = require("./config/env");
const { connectMongo } = require("./db/connect");
const { createApp } = require("./app");

async function main() {
  await connectMongo(env.mongoUri);
  if(connectMongo)
  {
    console.log("DB Connected");
  }

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});