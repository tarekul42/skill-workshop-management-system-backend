import { Types } from "mongoose";
import { IPayment } from "../payment/payment.interface.js";
import { IUser } from "../user/user.interface.js";
import { IWorkshop } from "../workshop/workshop.interface.js";
declare enum ENROLLMENT_STATUS {
    PENDING = "PENDING",
    CANCEL = "CANCEL",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED"
}
interface IEnrollment {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    workshop: Types.ObjectId;
    payment?: Types.ObjectId;
    studentCount: number;
    status: ENROLLMENT_STATUS;
    isDeleted?: boolean;
    deletedAt?: Date;
    createdAt?: Date;
}
interface IEnrollmentPopulated extends Omit<IEnrollment, "user" | "workshop" | "payment"> {
    user: IUser;
    workshop: IWorkshop;
    payment: IPayment;
}
export { ENROLLMENT_STATUS, IEnrollment, IEnrollmentPopulated };
