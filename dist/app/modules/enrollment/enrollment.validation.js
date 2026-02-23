"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnrollmentStatusZodSchema = exports.createEnrollmentZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const enrollment_interface_1 = require("./enrollment.interface");
const createEnrollmentZodSchema = zod_1.default.object({
    workshop: zod_1.default.string(),
    studentCount: zod_1.default.number().int().positive(),
});
exports.createEnrollmentZodSchema = createEnrollmentZodSchema;
const updateEnrollmentStatusZodSchema = zod_1.default.object({
    status: zod_1.default.enum(Object.values(enrollment_interface_1.ENROLLMENT_STATUS)),
});
exports.updateEnrollmentStatusZodSchema = updateEnrollmentStatusZodSchema;
