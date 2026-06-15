import mongoose, { model, Schema } from "mongoose";
import auditPlugin from "../../utils/auditPlugin.js";
import softDeletePlugin from "../../utils/softDeletePlugin.js";
import { IsActive, UserRole } from "./user.interface.js";
const authProviderSchema = new Schema({
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
}, {
    versionKey: false,
    _id: false,
});
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    phone: { type: String },
    picture: { type: String },
    age: { type: Number },
    address: { type: String },
    isActive: {
        type: String,
        enum: Object.values(IsActive),
        default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.STUDENT,
    },
    expertise: { type: String },
    bio: { type: String },
    auths: {
        type: [authProviderSchema],
        validate: {
            validator: function (auths) {
                const providers = auths.map((a) => a.provider);
                return new Set(providers).size === providers.length;
            },
            message: "Duplicate auth providers are not allowed.",
        },
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (_doc, ret) => {
            delete ret.password;
            return ret;
        },
    },
});
userSchema.plugin(softDeletePlugin);
userSchema.plugin(auditPlugin);
userSchema.index({ isDeleted: 1, isActive: 1, role: 1 });
userSchema.index({ isDeleted: 1, isVerified: 1 });
userSchema.index({ name: "text", email: "text", address: "text" });
// Cascade soft delete: when a user is soft-deleted, mark their enrollments
// and reviews as deleted too so they don't appear in aggregations or lists.
userSchema.pre("save", async function () {
    const doc = this;
    if (doc.isModified("isDeleted") && doc.isDeleted) {
        const Enrollment = mongoose.model("Enrollment");
        const Review = mongoose.model("Review");
        await Promise.all([
            Enrollment.updateMany({ user: doc._id }, { isDeleted: true, deletedAt: new Date() }),
            Review.updateMany({ user: doc._id }, { isDeleted: true, deletedAt: new Date() }),
        ]);
    }
});
const User = model("User", userSchema);
export default User;
