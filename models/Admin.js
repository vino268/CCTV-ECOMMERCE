import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: "",
  },
  profileImage: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "admin",
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
