import { Request, Response } from "express";
declare const CategoryController: {
    createCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSingleCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllCategories: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteCategory: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default CategoryController;
