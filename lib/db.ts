import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tn_automation";

declare global {
  var __mongooseConn: typeof mongoose | undefined;
}

export default async function dbConnect() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!global.__mongooseConn) {
    global.__mongooseConn = await mongoose.connect(MONGODB_URI);
  }

  return global.__mongooseConn;
}
