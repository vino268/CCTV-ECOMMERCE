const dotenv = require("dotenv");
dotenv.config();
// Ensure Cloudinary is configured for the Express backend
try {
  require("./lib/cloudinary");
} catch (err) {
  // ignore if not present in this environment; Next app routes use lib/cloudinary.ts
}

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/categories");
const serviceRoutes = require("./routes/services");
const settingsRoutes = require("./routes/settings");
const contactRoutes = require("./routes/contact");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const addressRoutes = require("./routes/address");
const profileRoutes = require("./routes/profile");
const uploadRoutes = require("./routes/upload");

console.log("Mongo URI Exists:", !!process.env.MONGODB_URI);
console.log("JWT Exists:", !!process.env.JWT_SECRET);

const app = express();

mongoose.set("strictQuery", true);
app.set("trust proxy", 1);

const allowedOrigins = [
 "http://localhost:3000",
 "http://localhost:3001",
 "https://tnautomation.in",
 "https://www.tnautomation.in",
 "https://cctv-ecommerce.vercel.app",
 String(process.env.FRONTEND_ORIGIN || "").trim(),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(compression());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, connected: mongoose.connection.readyState === 1 });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/upload", uploadRoutes);

app.use((req, res) => {
  return res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled server error:", error);
  const status = Number(error?.status || error?.statusCode || 500);
  const message = status >= 500 ? "Internal server error" : String(error?.message || "Request error");
  return res.status(status).json({ success: false, message });
});

async function connectDB() {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log("MongoDB connected");

  const requiredCollections = ["services", "settings", "products", "categories"];
  for (const collectionName of requiredCollections) {
    try {
      const exists = await mongoose.connection.db
        .listCollections({ name: collectionName })
        .hasNext();

      let count = 0;
      if (exists) {
        count = await mongoose.connection.db.collection(collectionName).countDocuments({});
      }

      console.log(`Collection check: ${collectionName} exists=${exists} count=${count}`);
    } catch (error) {
      console.error(`Collection check failed for ${collectionName}:`, error);
    }
  }
}

async function startServer() {
  try {
    await connectDB();

    const PORT = Number(process.env.PORT || 5000);
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        console.log(`Port ${PORT} is already in use. Another backend instance is already running.`);
        process.exit(0);
      }

      console.error("Failed to start HTTP server:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
