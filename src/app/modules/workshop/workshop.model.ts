import { model, Schema } from "mongoose";
import { ILevel, IWorkshop } from "./workshop.interface";

const levelSchema = new Schema<ILevel>(
  {
    name: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  },
);

const Level = model<ILevel>("Level", levelSchema);

const workshopSchema = new Schema<IWorkshop>(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String },
    images: { type: [String], default: [] },
    location: { type: String },
    price: { type: Number },
    startDate: { type: Date },
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
    },
    level: {
      type: Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

workshopSchema.pre("save", async function () {
  if (this.isModified("title")) {
    const baseSlug = this.title.toLowerCase().split(" ").join("-");
    let slug = `${baseSlug}`;

    let counter = 0;
    while (await WorkShop.exists({ slug })) {
      slug = `${slug}-${counter++}`;
    }
    this.slug = slug;
  }
});

workshopSchema.pre("findOneAndUpdate", async function () {
  const workshop = this.getUpdate() as Partial<IWorkshop>;

  if (workshop.title) {
    const baseSlug = workshop.title.toLowerCase().split(" ").join("-");
    let slug = `${baseSlug}`;

    let counter = 0;
    while (await WorkShop.exists({ slug })) {
      slug = `${slug}-${counter++}`;
    }
    workshop.slug = slug;
  }
  this.setUpdate(workshop);
});

const WorkShop = model<IWorkshop>("Workshop", workshopSchema);

export { Level, WorkShop };
