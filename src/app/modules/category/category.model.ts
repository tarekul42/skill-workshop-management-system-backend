import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    thumbnail: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

const Category = model<ICategory>("Category", categorySchema);

export { Category };
