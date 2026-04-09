import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "https://tnautomation.in"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express API running on port ${PORT}`);
});
