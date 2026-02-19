import { model, Schema } from "mongoose";
import { ENROLLMENT_STATUS, IEnrollment } from "./enrollment.interface";

const enrollmentSchema = new Schema<IEnrollment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  workshop: {
    type: Schema.Types.ObjectId,
    ref: "Workshop",
    required: true,
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
  },
});

const Enrollment = model<IEnrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
