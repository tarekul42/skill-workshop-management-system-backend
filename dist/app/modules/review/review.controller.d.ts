import { Request, Response } from "express";
declare const ReviewController: {
    createReview: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteReview: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserReviewForWorkshop: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWorkshopReviewStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWorkshopReviews: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateReview: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default ReviewController;
