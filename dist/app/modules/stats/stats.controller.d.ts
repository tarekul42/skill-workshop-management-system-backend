import { Request, Response } from "express";
declare const StatsController: {
    getEnrollmentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPaymentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWorkshopStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default StatsController;
