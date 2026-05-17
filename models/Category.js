import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Category) {
  mongoose.deleteModel("Category");
}

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;
