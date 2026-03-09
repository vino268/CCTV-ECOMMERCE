import mongoose from "mongoose";

const InstallationRequestSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  serviceType: String,
  message: String,
  status: {
    type: String,
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.InstallationRequest ||
mongoose.model("InstallationRequest", InstallationRequestSchema);