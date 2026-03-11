import mongoose from "mongoose";

const StoreSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    storeInformation: {
      storeName: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
      email: { type: String, default: "" },
      businessAddress: { type: String, default: "" },
    },
    shippingSettings: {
      freeShippingThreshold: { type: Number, default: 0, min: 0 },
      standardShippingCost: { type: Number, default: 0, min: 0 },
    },
    paymentSettings: {
      cashOnDelivery: { type: Boolean, default: true },
      upi: { type: Boolean, default: true },
      onlinePayment: { type: Boolean, default: true },
    },
    footer: {
      description: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    maintenanceMode: {
      enabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", StoreSettingsSchema);
