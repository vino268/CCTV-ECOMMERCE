import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    cashOnDelivery: { type: Boolean, default: true },
    upi: { type: Boolean, default: true },
    onlinePayment: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);
