import mongoose from "mongoose";

const AdminLogSchema = new mongoose.Schema(
  {
    adminName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.AdminLog ||
  mongoose.model("AdminLog", AdminLogSchema);
