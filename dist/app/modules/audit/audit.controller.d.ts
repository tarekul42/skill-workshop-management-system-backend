import { Request, Response } from "express";
declare const AuditController: {
    getAuditLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAuditLogById: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default AuditController;
