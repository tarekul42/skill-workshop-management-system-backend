import { IEnrollment } from "./enrollment.interface.js";
declare const Enrollment: import("mongoose").Model<IEnrollment, {}, {}, {}, import("mongoose").Document<unknown, {}, IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & IEnrollment & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEnrollment>;
export default Enrollment;
