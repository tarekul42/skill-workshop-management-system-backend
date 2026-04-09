import { model, Schema } from "mongoose";
import auditPlugin from "../../utils/auditPlugin";
import softDeletePlugin from "../../utils/softDeletePlugin";
const categorySchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    thumbnail: { type: String, trim: true },
    description: { type: String, trim: true },
}, {
    timestamps: true,
});
categorySchema.plugin(softDeletePlugin);
categorySchema.plugin(auditPlugin);
const Category = model("Category", categorySchema);
export { Category };
