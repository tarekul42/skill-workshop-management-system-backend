import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    thumbnail: { type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  },
);

const Category = model<ICategory>("Category", categorySchema);

export { Category };
