import { IAuditLog } from "./audit.interface";
declare const AuditLog: import("mongoose").Model<IAuditLog, {}, {}, {}, import("mongoose").Document<unknown, {}, IAuditLog, {}, import("mongoose").DefaultSchemaOptions> & IAuditLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IAuditLog>;
export default AuditLog;
