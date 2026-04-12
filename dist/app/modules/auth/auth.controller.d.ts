import { NextFunction, Request, Response } from "express";
declare const AuthControllers: {
    credentialsLogin: (req: Request, res: Response, next: NextFunction) => void;
    getNewAccessToken: (req: Request, res: Response, next: NextFunction) => void;
    logout: (req: Request, res: Response, next: NextFunction) => void;
    changePassword: (req: Request, res: Response, next: NextFunction) => void;
    setPassword: (req: Request, res: Response, next: NextFunction) => void;
    forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
    resetPassword: (req: Request, res: Response, next: NextFunction) => void;
    googleCallback: (req: Request, res: Response, next: NextFunction) => void;
};
export default AuthControllers;
