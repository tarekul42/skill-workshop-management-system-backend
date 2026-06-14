import { IReview } from "./review.interface.js";
declare const Review: import("mongoose").Model<IReview, {}, {}, {}, import("mongoose").Document<unknown, {}, IReview, {}, import("mongoose").DefaultSchemaOptions> & IReview & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IReview>;
export default Review;
