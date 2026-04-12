import { model, Schema } from "mongoose";
import auditPlugin from "../../utils/auditPlugin.js";
import softDeletePlugin from "../../utils/softDeletePlugin.js";
import { ENROLLMENT_STATUS, IEnrollment } from "./enrollment.interface.js";

const enrollmentSchema = new Schema<IEnrollment>(
  {
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
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    studentCount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.PENDING,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

enrollmentSchema.plugin(softDeletePlugin);
enrollmentSchema.plugin(auditPlugin);

enrollmentSchema.index(
  { workshop: 1, user: 1 },
  {
    partialFilterExpression: { status: { $in: ["PENDING", "COMPLETE"] } },
    unique: true,
  },
);

const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
