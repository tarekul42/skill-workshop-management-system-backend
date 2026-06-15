import { ClientSession, Types } from "mongoose";
import { IReview, IReviewStats } from "./review.interface.js";
declare const ReviewRepository: {
    create: (payload: Partial<IReview>, session?: ClientSession) => Promise<import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deleteById: (reviewId: string) => Promise<(import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findById: (reviewId: string) => Promise<(import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findByUserAndWorkshop: (userId: string, workshopId: string) => Promise<(import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findByWorkshop: (workshopId: string, page: number, limit: number, sort: string) => Promise<{
        data: (IReview & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPage: number;
        };
    }>;
    getStatsByWorkshop: (workshopId: string) => Promise<IReviewStats>;
    updateById: (reviewId: string, payload: Partial<IReview>) => Promise<(import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
};
export default ReviewRepository;
