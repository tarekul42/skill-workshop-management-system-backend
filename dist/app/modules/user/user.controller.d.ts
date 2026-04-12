import { Request, Response } from "express";
declare const UserControllers: {
    createUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getSingleUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default UserControllers;
