import { model, Schema } from "mongoose";
import auditPlugin from "../../utils/auditPlugin.js";
import softDeletePlugin from "../../utils/softDeletePlugin.js";
import { REVIEW_STATUS } from "./review.interface.js";
const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    workshop: {
        type: Schema.Types.ObjectId,
        ref: "Workshop",
        required: true,
        index: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    status: {
        type: String,
        enum: Object.values(REVIEW_STATUS),
        default: REVIEW_STATUS.APPROVED,
        index: true,
    },
}, {
    timestamps: true,
});
reviewSchema.plugin(softDeletePlugin);
reviewSchema.plugin(auditPlugin);
// One review per user per workshop
reviewSchema.index({ user: 1, workshop: 1 }, {
    unique: true,
    partialFilterExpression: { isDeleted: { $eq: false } },
});
// For fetching approved reviews by workshop, sorted by newest
reviewSchema.index({ workshop: 1, status: 1, createdAt: -1 });
const Review = model("Review", reviewSchema);
export default Review;
