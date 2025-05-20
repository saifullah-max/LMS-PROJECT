const mongoose = require("mongoose");

// Connect MongoDB
const connectToDB = async () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("🌱 MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));
};

module.exports = { connectToDB}