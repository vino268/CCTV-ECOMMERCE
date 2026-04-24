import mongoose from "mongoose";

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
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
  dob: {
    type: Date,
    default: null,
  },
  phone: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  profileImage: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  collection: "users",
  timestamps: true,
});

export default mongoose.model("User", UserSchema);
