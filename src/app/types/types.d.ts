import "express";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      userId?: string;
      email?: string;
      role?: string;
    }

    interface Request {
      apiVersion?: number;
      resetToken?: string;
    }
  }
}
