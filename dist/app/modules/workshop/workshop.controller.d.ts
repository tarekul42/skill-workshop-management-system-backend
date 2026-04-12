import { Request, Response } from "express";
declare const WorkshopController: {
    createLevel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSingleLevel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllLevels: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateLevel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteLevel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createWorkshop: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSingleWorkshop: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllWorkshops: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateWorkshop: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteWorkshop: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default WorkshopController;
