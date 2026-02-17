"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategoryZodSchema = exports.createCategoryZodSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const createCategoryZodSchema = zod_1.default.object({
    name: zod_1.default.string().min(1),
    thumbnail: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
});
exports.createCategoryZodSchema = createCategoryZodSchema;
const updateCategoryZodSchema = zod_1.default.object({
    name: zod_1.default.string().min(1).optional(),
    thumbnail: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
});
exports.updateCategoryZodSchema = updateCategoryZodSchema;
