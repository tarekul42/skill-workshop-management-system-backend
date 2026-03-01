"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkShop = exports.Level = void 0;
const mongoose_1 = require("mongoose");
const levelSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
}, {
    timestamps: true,
});
const Level = (0, mongoose_1.model)("Level", levelSchema);
exports.Level = Level;
const workshopSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true,
    },
    level: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Level",
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});
const WorkShop = (0, mongoose_1.model)("Workshop", workshopSchema);
exports.WorkShop = WorkShop;
const generateUniqueSlug = async (baseSlug, excludeId) => {
    let slug = baseSlug;
    let counter = 0;
    while (true) {
        const query = { slug };
        if (excludeId) {
            query._id = { $ne: new mongoose_1.Types.ObjectId(excludeId) };
        }
        const exists = await WorkShop.findOne(query);
        if (!exists)
            break;
        slug = `${baseSlug}-${counter++}`;
    }
    return slug;
};
workshopSchema.pre("save", async function () {
    if (this.isModified("title") || !this.slug) {
        const baseSlug = this.title.toLowerCase().split(" ").join("-");
        this.slug = await generateUniqueSlug(baseSlug);
    }
});
workshopSchema.pre("findOneAndUpdate", async function () {
    const update = this.getUpdate();
    const query = this.getQuery();
    if (update?.title) {
        const baseSlug = update.title.toLowerCase().split(" ").join("-");
        const workshopId = query._id?.toString();
        update.slug = await generateUniqueSlug(baseSlug, workshopId);
    }
    this.setUpdate(update);
});
