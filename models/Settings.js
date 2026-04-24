const mongoose = require("mongoose");

const businessHoursSchema = new mongoose.Schema(
  {
    monday: { type: String, default: "", trim: true },
    tuesday: { type: String, default: "", trim: true },
    wednesday: { type: String, default: "", trim: true },
    thursday: { type: String, default: "", trim: true },
    friday: { type: String, default: "", trim: true },
    saturday: { type: String, default: "", trim: true },
    sunday: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    businessHours: {
      type: businessHoursSchema,
      default: () => ({
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: "",
      }),
    },
  },
  {
    timestamps: true,
    collection: "settings",
  }
);

module.exports = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
