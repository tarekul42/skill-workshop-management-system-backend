import { Document, Schema } from "mongoose";
/** Interface for models that use the softDeletePlugin */
export interface ISoftDelete extends Document {
    isDeleted: boolean;
    deletedAt: Date | null;
    softDelete: () => Promise<this>;
}
declare const softDeletePlugin: (schema: Schema) => void;
export default softDeletePlugin;
