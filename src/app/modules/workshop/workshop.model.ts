import { model, Schema, Types } from "mongoose";
import auditPlugin from "../../utils/auditPlugin.js";
import logger from "../../utils/logger.js";
import { generateUniqueSlug } from "../../utils/slugify.js";
import softDeletePlugin from "../../utils/softDeletePlugin.js";
import { ILevel, IWorkshop } from "./workshop.interface.js";

const levelSchema = new Schema<ILevel>(
  {
    name: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  },
);

levelSchema.plugin(softDeletePlugin);
levelSchema.plugin(auditPlugin);

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
    currentEnrollments: {
      type: Number,
      default: 0,
      min: 0,
    },
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

workshopSchema.plugin(softDeletePlugin);
workshopSchema.plugin(auditPlugin);

const WorkShop = model<IWorkshop>("Workshop", workshopSchema);

workshopSchema.pre("save", async function () {
  logger.debug({ msg: "Pre-save hook title", title: this.title });
  if (this.isModified("title") || !this.slug) {
    this.slug = await generateUniqueSlug(WorkShop, this.title);
    logger.debug({ msg: "Generated slug", slug: this.slug });
  }
});

workshopSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as Partial<IWorkshop> & {
    _id?: Types.ObjectId;
  };
  const query = this.getQuery();

  if (update?.title) {
    const workshopId = query._id?.toString();
    update.slug = await generateUniqueSlug(WorkShop, update.title, workshopId);
  }
  this.setUpdate(update);
});

export { Level, WorkShop };
