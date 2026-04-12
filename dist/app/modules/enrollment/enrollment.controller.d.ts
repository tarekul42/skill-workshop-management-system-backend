import { Request, Response } from "express";
declare const EnrollmentController: {
    createEnrollment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserEnrollments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSingleEnrollment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllEnrollments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateEnrollmentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelEnrollment: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default EnrollmentController;
