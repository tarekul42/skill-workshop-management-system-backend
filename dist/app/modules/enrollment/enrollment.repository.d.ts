import { ClientSession } from "mongoose";
import { IEnrollment } from "./enrollment.interface.js";
declare const EnrollmentRepository: {
    startTransaction: () => Promise<import("mongodb").ClientSession>;
    createEnrollmentWithPayment: (payload: Partial<IEnrollment>, userId: string, session: ClientSession) => Promise<{
        enrollmentId: import("mongoose").Types.ObjectId;
        paymentUrl: any;
        enrollment: (import("mongoose").Document<unknown, {}, IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & IEnrollment & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
    }>;
};
export default EnrollmentRepository;
