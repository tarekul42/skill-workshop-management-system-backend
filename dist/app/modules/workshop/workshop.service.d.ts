import { JwtPayload } from "jsonwebtoken";
import { ISoftDelete } from "../../utils/softDeletePlugin.js";
import { ILevel, IWorkshop } from "./workshop.interface.js";
declare const WorkshopService: {
    createLevel: (payload: ILevel) => Promise<import("mongoose").Document<unknown, {}, ILevel, {}, import("mongoose").DefaultSchemaOptions> & ILevel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getSingleLevel: (id: string) => Promise<{
        data: import("mongoose").Document<unknown, {}, ILevel, {}, import("mongoose").DefaultSchemaOptions> & ILevel & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getAllLevels: (query: Record<string, string>) => Promise<{
        data: (import("mongoose").Document<unknown, {}, ILevel, {}, import("mongoose").DefaultSchemaOptions> & ILevel & {
            _id: import("mongoose").Types.ObjectId;
        } & {
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
    updateLevel: (id: string, payload: Partial<ILevel>) => Promise<(import("mongoose").Document<unknown, {}, ILevel, {}, import("mongoose").DefaultSchemaOptions> & ILevel & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    deleteLevel: (id: string) => Promise<ISoftDelete>;
    createWorkshop: (payload: IWorkshop) => Promise<import("mongoose").Document<unknown, {}, IWorkshop, {}, import("mongoose").DefaultSchemaOptions> & IWorkshop & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getSingleWorkshop: (slug: string) => Promise<{
        data: import("mongoose").Document<unknown, {}, IWorkshop, {}, import("mongoose").DefaultSchemaOptions> & IWorkshop & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getAllWorkshops: (query: Record<string, string>) => Promise<any>;
    updateWorkshop: (id: string, payload: Partial<IWorkshop>, currentUser: JwtPayload) => Promise<(import("mongoose").Document<unknown, {}, IWorkshop, {}, import("mongoose").DefaultSchemaOptions> & IWorkshop & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    deleteWorkshop: (id: string, currentUser: JwtPayload) => Promise<ISoftDelete>;
};
export default WorkshopService;
