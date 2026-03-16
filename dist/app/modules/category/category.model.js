"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const softDeletePlugin_1 = __importDefault(require("../../utils/softDeletePlugin"));
const categorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    thumbnail: { type: String, trim: true },
    description: { type: String, trim: true },
}, {
    timestamps: true,
});
categorySchema.plugin(softDeletePlugin_1.default);
const Category = (0, mongoose_1.model)("Category", categorySchema);
exports.Category = Category;
