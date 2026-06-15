import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { ISoftDelete } from "../../utils/softDeletePlugin.js";
import { ILevel, IWorkshop } from "./workshop.interface.js";
declare const WorkshopService: {
    createLevel: (payload: ILevel) => Promise<mongoose.Document<unknown, {}, ILevel, {}, mongoose.DefaultSchemaOptions> & ILevel & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getSingleLevel: (id: string) => Promise<{
        data: mongoose.Document<unknown, {}, ILevel, {}, mongoose.DefaultSchemaOptions> & ILevel & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getAllLevels: (query: Record<string, string>) => Promise<{
        data: (mongoose.Document<unknown, {}, ILevel, {}, mongoose.DefaultSchemaOptions> & ILevel & {
            _id: mongoose.Types.ObjectId;
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
    updateLevel: (id: string, payload: Partial<ILevel>) => Promise<(mongoose.Document<unknown, {}, ILevel, {}, mongoose.DefaultSchemaOptions> & ILevel & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    deleteLevel: (id: string) => Promise<ISoftDelete>;
    createWorkshop: (payload: IWorkshop) => Promise<mongoose.Document<unknown, {}, IWorkshop, {}, mongoose.DefaultSchemaOptions> & IWorkshop & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getSingleWorkshop: (slugOrId: string) => Promise<{
        data: mongoose.Document<unknown, {}, IWorkshop, {}, mongoose.DefaultSchemaOptions> & IWorkshop & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        };
    }>;
    getAllWorkshops: (query: Record<string, string>) => Promise<any>;
    updateWorkshop: (id: string, payload: Partial<IWorkshop>, currentUser: JwtPayload) => Promise<(mongoose.Document<unknown, {}, IWorkshop, {}, mongoose.DefaultSchemaOptions> & IWorkshop & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    deleteWorkshop: (id: string, currentUser: JwtPayload) => Promise<ISoftDelete>;
};
export default WorkshopService;
