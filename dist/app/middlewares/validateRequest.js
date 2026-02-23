"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateRequest = (zodSchema) => async (req, _res, next) => {
    try {
        if (req.body.data && typeof req.body.data === "string") {
            req.body = JSON.parse(req.body.data);
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
exports.default = validateRequest;
