import { Types } from "mongoose";
import { ENROLLMENT_STATUS, IEnrollment, IEnrollmentPopulated } from "./enrollment.interface";
declare const EnrollmentService: {
    createEnrollment: (payload: Partial<IEnrollment>, userId: string) => Promise<{
        paymentUrl: any;
        enrollment: (import("mongoose").Document<unknown, {}, IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & IEnrollment & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
    }>;
    getUserEnrollments: (userId: string) => Promise<{
        data: (import("mongoose").Document<unknown, {}, IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & IEnrollment & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
    }>;
    getSingleEnrollment: (enrollmentId: string, userId: string, userRole: string) => Promise<IEnrollmentPopulated>;
    getAllEnrollments: (query: Record<string, string>) => Promise<{
        data: (import("mongoose").Document<unknown, {}, IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & IEnrollment & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPage: number;
        };
    }>;
    updateEnrollmentStatus: (enrollmentId: string, status: ENROLLMENT_STATUS, userId: string, userRole: string) => Promise<(import("mongoose").Document<unknown, {}, IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & IEnrollment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    cancelEnrollment: (enrollmentId: string, userId: string) => Promise<(import("mongoose").Document<unknown, {}, IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & IEnrollment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
};
export default EnrollmentService;
