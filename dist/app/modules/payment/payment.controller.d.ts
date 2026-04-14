import { Request, Response } from "express";
declare const PaymentController: {
    initPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    successPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    failPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getInvoiceDownloadUrl: (req: Request, res: Response, next: import("express").NextFunction) => void;
    validatePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    handleIPN: (req: Request, res: Response, next: import("express").NextFunction) => void;
    refundPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPaymentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default PaymentController;
