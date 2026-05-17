const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Category) {
  mongoose.deleteModel("Category");
}

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);
