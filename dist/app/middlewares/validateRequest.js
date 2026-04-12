import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError.js";
const validateRequest = (zodSchema) => async (req, _res, next) => {
    try {
        if (!req.body) {
            req.body = {};
        }
        if (req.body.data && typeof req.body.data === "string") {
            try {
                req.body = JSON.parse(req.body.data);
            }
            catch {
                throw new AppError(StatusCodes.BAD_REQUEST, "Invalid JSON in request body.data");
            }
        }
        else if (req.body.data && typeof req.body.data === "object") {
            req.body = req.body.data;
        }
        req.body = await zodSchema.parseAsync(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
export default validateRequest;
