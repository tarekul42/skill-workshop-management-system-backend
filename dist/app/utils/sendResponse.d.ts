import { Response } from "express";
interface IMeta {
    total: number;
}
interface ISendResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    data: T;
    meta?: IMeta;
}
declare const sendResponse: <T>(res: Response, data: ISendResponse<T>) => void;
export default sendResponse;
//# sourceMappingURL=sendResponse.d.ts.map