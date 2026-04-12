import { Types } from "mongoose";
import { ILevel, IWorkshop } from "./workshop.interface.js";
declare const Level: import("mongoose").Model<ILevel, {}, {}, {}, import("mongoose").Document<unknown, {}, ILevel, {}, import("mongoose").DefaultSchemaOptions> & ILevel & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ILevel>;
declare const WorkShop: import("mongoose").Model<IWorkshop, {}, {}, {}, import("mongoose").Document<unknown, {}, IWorkshop, {}, import("mongoose").DefaultSchemaOptions> & IWorkshop & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IWorkshop>;
export { Level, WorkShop };
