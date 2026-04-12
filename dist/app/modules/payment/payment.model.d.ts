import { IPayment } from "./payment.interface.js";
declare const Payment: import("mongoose").Model<IPayment, {}, {}, {}, import("mongoose").Document<unknown, {}, IPayment, {}, import("mongoose").DefaultSchemaOptions> & IPayment & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPayment>;
export default Payment;
