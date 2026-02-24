"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const queryBuilder_1 = __importDefault(require("../../utils/queryBuilder"));
const category_constant_1 = require("./category.constant");
const category_model_1 = require("./category.model");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const createCategory = async (payload) => {
    if (typeof payload.name !== "string") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid category name");
    }
    const existingCategory = await category_model_1.Category.findOne({
        name: { $eq: payload.name },
    });
    if (existingCategory) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "A Category with this name already exists");
    }
    const category = await category_model_1.Category.create(payload);
    return category;
};
const getSingleCategory = async (slug) => {
    const category = await category_model_1.Category.findOne({ slug });
    return {
        data: category,
    };
};
const getAllCategories = async (query) => {
    const queryBuilder = new queryBuilder_1.default(category_model_1.Category.find(), query);
    const categoriesData = queryBuilder
        .search(category_constant_1.categorySearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();
    const [data, meta] = await Promise.all([
        categoriesData.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
};
const updateCategory = async (id, payload) => {
    const existingCategory = await category_model_1.Category.findById(id);
    if (!existingCategory) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Category not found");
    }
    // 1. Validation: Name specific checks
    // We copy to a local variable to handle trimming without mutating the original payload
    let payloadName = payload.name;
    if (payloadName !== undefined) {
        if (typeof payloadName !== "string") {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid category name");
        }
        const trimmedName = payloadName.trim();
        if (trimmedName.length === 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Category name cannot be empty");
        }
        // Update our local variable to the clean version
        payloadName = trimmedName;
    }
    // 2. Duplicate Check: Only run if name is being updated.
    if (payloadName) {
        const duplicateCategory = await category_model_1.Category.findOne({
            name: { $eq: payloadName },
            _id: { $ne: id },
        });
        if (duplicateCategory) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "A Category with this name already exists");
        }
    }
    // 3. Prepare update data
    const updateData = {};
    if (payloadName !== undefined) {
        updateData.name = payloadName;
        // Robust slug generation
        updateData.slug = payloadName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }
    if (payload.thumbnail !== undefined) {
        updateData.thumbnail = payload.thumbnail;
    }
    if (payload.description !== undefined) {
        updateData.description = payload.description;
    }
    // 4. Update & existence check in one go
    const updatedCategory = await category_model_1.Category.findByIdAndUpdate(id, { $set: updateData }, {
        new: true,
        runValidators: true,
    });
    if (!updatedCategory) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Category not found");
    }
    if (payload.thumbnail && existingCategory.thumbnail) {
        try {
            await (0, cloudinary_config_1.deleteImageFromCloudinary)(existingCategory.thumbnail);
        }
        catch (error) {
            // Log error but don't fail the request - category update already succeeded
            console.error("Failed to delete old thumbnail from Cloudinary:", error);
        }
    }
    return updatedCategory;
};
const deleteCategory = async (id) => {
    await category_model_1.Category.findByIdAndDelete(id);
    return null;
};
const CategoryService = {
    createCategory,
    getSingleCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
};
exports.default = CategoryService;
