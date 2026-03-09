import mongoose from "mongoose";

const MONGODB_URI = "mongodb://127.0.0.1:27017/tn_automation";

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(MONGODB_URI);
};