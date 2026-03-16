import { model, Schema, Types } from "mongoose";
import logger from "../../utils/logger";
import softDeletePlugin from "../../utils/softDeletePlugin";
import { ILevel, IWorkshop } from "./workshop.interface";

const levelSchema = new Schema<ILevel>(
  {
    name: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  },
);

levelSchema.plugin(softDeletePlugin);

const Level = model<ILevel>("Level", levelSchema);

const workshopSchema = new Schema<IWorkshop>(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String },
    images: { type: [String], default: [] },
    location: { type: String, index: true },
    price: { type: Number },
    startDate: { type: Date, index: true },
    endDate: { type: Date },
    whatYouLearn: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    syllabus: { type: [String], default: [] },
    maxSeats: { type: Number },
    minAge: { type: Number },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    level: {
      type: Schema.Types.ObjectId,
      ref: "Level",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

workshopSchema.plugin(softDeletePlugin);

const WorkShop = model<IWorkshop>("Workshop", workshopSchema);

const generateUniqueSlug = async (
  baseSlug: string,
  excludeId?: string,
): Promise<string> => {
  let slug = baseSlug;
  let counter = 0;

  while (counter < 100) {
    const query: { slug: string; _id?: { $ne: Types.ObjectId } } = { slug };
    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const exists = await WorkShop.findOne(query);
    if (!exists) break;

    slug = `${baseSlug}-${counter++}`;
  }

  if (counter >= 100) {
    logger.warn({ message: "Slug generation limit reached", baseSlug });
  }

  return slug;
};

workshopSchema.pre("save", async function () {
  logger.info({ message: "Pre-save hook title", title: this.title });
  if (this.isModified("title") || !this.slug) {
    const baseSlug = (this.title || "").toLowerCase().split(" ").join("-");
    this.slug = await generateUniqueSlug(baseSlug);
    logger.info({ message: "Generated slug", slug: this.slug });
  }
});

workshopSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as Partial<IWorkshop> & {
    _id?: Types.ObjectId;
  };
  const query = this.getQuery();

  if (update?.title) {
    const baseSlug = update.title.toLowerCase().split(" ").join("-");
    const workshopId = query._id?.toString();
    update.slug = await generateUniqueSlug(baseSlug, workshopId);
  }
  this.setUpdate(update);
});

export { Level, WorkShop };
