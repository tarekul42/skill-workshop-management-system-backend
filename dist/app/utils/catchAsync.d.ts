import { NextFunction, Request, Response } from "express";
type asyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const catchAsync: (fn: asyncHandler) => (req: Request, res: Response, next: NextFunction) => void;
export default catchAsync;
//# sourceMappingURL=catchAsync.d.ts.map