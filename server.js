const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const productRoutes = require("./routes/product");

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

async function connectDB() {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    bufferCommands: false,
  });

  console.log("MongoDB Atlas connected");
}

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API healthy" });
});

app.use("/api/products", productRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = Number(process.env.PORT || 5000);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect database:", error);
    process.exit(1);
  });
