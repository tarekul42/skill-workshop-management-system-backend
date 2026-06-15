import { Types } from "mongoose";
import { type IReview, type IReviewStats } from "./review.interface.js";
declare const ReviewService: {
    createReview: (payload: Partial<IReview>, userId: string) => Promise<import("mongoose").PopulateDocumentResult<import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }, {}, IReview, IReview>>;
    deleteReview: (reviewId: string, userId: string, userRole: string) => Promise<null>;
    getUserReviewForWorkshop: (workshopId: string, userId: string) => Promise<(import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    getWorkshopReviewStats: (workshopId: string) => Promise<IReviewStats>;
    getWorkshopReviews: (workshopId: string, page: number, limit: number, sort: string) => Promise<{
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
    updateReview: (reviewId: string, payload: Partial<IReview>, userId: string, userRole: string) => Promise<(import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
};
export default ReviewService;
