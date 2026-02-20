import { Types } from "mongoose";

enum ENROLLMENT_STATUS {
  PENDING = "PENDING",
  CANCEL = "CANCEL",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}

interface IEnrollment {
  user: Types.ObjectId;
  workshop: Types.ObjectId;
  payment?: Types.ObjectId;
  studentCount: number;
  status: ENROLLMENT_STATUS;
}

export { ENROLLMENT_STATUS, IEnrollment };
