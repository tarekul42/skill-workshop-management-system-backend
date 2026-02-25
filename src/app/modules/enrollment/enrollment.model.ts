import { model, Schema } from "mongoose";
import { ENROLLMENT_STATUS, IEnrollment } from "./enrollment.interface";

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

enrollmentSchema.index({ user: 1, workshop: 1 });

const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
