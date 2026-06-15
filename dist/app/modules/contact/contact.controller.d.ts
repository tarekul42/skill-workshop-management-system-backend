import { Request, Response } from "express";
declare const ContactController: {
    createContact: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteContact: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllContacts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getContactById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    markAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default ContactController;
