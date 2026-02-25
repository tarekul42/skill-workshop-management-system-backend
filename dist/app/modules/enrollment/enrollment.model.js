"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const enrollment_interface_1 = require("./enrollment.interface");
const enrollmentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    workshop: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Workshop",
        required: true,
        index: true,
    },
    payment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Payment",
    },
    studentCount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(enrollment_interface_1.ENROLLMENT_STATUS),
        default: enrollment_interface_1.ENROLLMENT_STATUS.PENDING,
        index: true,
    },
}, {
    timestamps: true,
});
enrollmentSchema.index({ user: 1, workshop: 1 });
const Enrollment = (0, mongoose_1.model)("Enrollment", enrollmentSchema);
exports.default = Enrollment;
