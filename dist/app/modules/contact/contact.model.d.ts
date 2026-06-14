import { IContact } from "./contact.interface.js";
declare const Contact: import("mongoose").Model<IContact, {}, {}, {}, import("mongoose").Document<unknown, {}, IContact, {}, import("mongoose").DefaultSchemaOptions> & IContact & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IContact>;
export default Contact;
