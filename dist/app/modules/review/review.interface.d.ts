import { Types } from "mongoose";
import { IUser } from "../user/user.interface.js";
import { IWorkshop } from "../workshop/workshop.interface.js";
declare enum REVIEW_STATUS {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
interface IReview {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    workshop: Types.ObjectId;
    rating: number;
    title: string;
    content: string;
    status: REVIEW_STATUS;
    isDeleted?: boolean;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
interface IReviewPopulated extends Omit<IReview, "user" | "workshop"> {
    user: Pick<IUser, "_id" | "name" | "picture">;
    workshop: Pick<IWorkshop, "title" | "slug"> & {
        _id: Types.ObjectId;
    };
}
interface IReviewStats {
    averageRating: number;
    totalReviews: number;
    distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}
export { IReview, IReviewPopulated, IReviewStats, REVIEW_STATUS };
