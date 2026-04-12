import { Response } from "express";
interface IMeta {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
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
