import mongoose from "mongoose";

const SiteSettingsSchema = new mongoose.Schema(
  {
    storeName: String,
    description: String,
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },
    contact: {
      phone: String,
      email: String,
      address: String,
    },
    social: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      youtube: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);
