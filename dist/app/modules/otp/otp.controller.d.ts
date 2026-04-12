import { Request, Response } from "express";
declare const OTPController: {
    sendOtp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyOtp: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default OTPController;
