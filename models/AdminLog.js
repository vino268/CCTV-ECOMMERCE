import mongoose from "mongoose";

const AdminLogSchema = new mongoose.Schema(
  {
    adminName: { type: String, required: true },
    type: { type: String, default: "system", trim: true },
    action: { type: String, required: true },
    message: {
      type: String,
      default: function defaultMessage() {
        return String(this.action || "").trim();
      },
      trim: true,
    },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.AdminLog ||
  mongoose.model("AdminLog", AdminLogSchema);
