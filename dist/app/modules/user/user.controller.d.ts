import { Request, Response } from "express";
declare const UserControllers: {
    createUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default UserControllers;
//# sourceMappingURL=user.controller.d.ts.map