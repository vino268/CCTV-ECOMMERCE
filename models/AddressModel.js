const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    fullName: { type: String, default: "", trim: true },
    name: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "addresses" }
);

addressSchema.pre("save", function syncFullName() {
  if (!this.fullName && this.name) {
    this.fullName = this.name;
  }
  if (!this.name && this.fullName) {
    this.name = this.fullName;
  }
});

module.exports = mongoose.models.AddressModel || mongoose.model("AddressModel", addressSchema);
