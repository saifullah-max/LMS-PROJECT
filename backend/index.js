// server/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectToDB } = require("./config/DB");

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const lectureRoutes = require("./routes/lectures");
// const { authenticateJWT, authorizeRoles } = require('./middleware/auth');  // still used inside your route files
const quizRoutes = require("./routes/quizzes");
const assignmentRoutes = require("./routes/assignments");
const aiRoutes = require("./routes/ai");
const { errors } = require("celebrate");
const errorHandler = require("./middleware/errorHandler");
const adminRoutes = require("./routes/admin");
const offlineRoutes = require("./routes/offline");
const userRoute = require("./routes/users");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// const mongoSanitize = require("express-mongo-sanitize");
// const expressSanitizer = require('express-sanitizer');

// Init Express
const app = express();

// Only apply Helmet and XSS cleaning in non-test environments
if (process.env.NODE_ENV !== "test") {
  const helmet = require("helmet");
  // const mongoSanitize = require("express-mongo-sanitize");
  const rateLimit = require("express-rate-limit");

  app.use(helmet());
  // app.use(mongoSanitize());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  // app.use(expressSanitizer());
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
}
app.use(express.json());

// Connect to MongoDB
connectToDB();

// Serve uploaded files from /uploads
// e.g. a lecture at /uploads/lectures/<courseId>/<filename>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/", (req, res) => {
  res.send("Hello");
});

// Mount your routers
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/offline", offlineRoutes);
app.use("/api/users", userRoute);

app.use(errors());
app.use(errorHandler);

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
