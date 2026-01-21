"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateRequest = (zodSchema) => async (req, _res, next) => {
    try {
        req.body = await zodSchema.parseAsync(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = validateRequest;
