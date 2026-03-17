const mongoose = require("mongoose");

async function connectMongo(mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
}

module.exports = { connectMongo };