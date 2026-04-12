import { model, Schema } from "mongoose";
import auditPlugin from "../../utils/auditPlugin.js";
import softDeletePlugin from "../../utils/softDeletePlugin.js";
import { ICategory } from "./category.interface.js";

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

categorySchema.plugin(softDeletePlugin);
categorySchema.plugin(auditPlugin);

const Category = model<ICategory>("Category", categorySchema);

export { Category };
