import { StatusCodes } from "http-status-codes";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import logger from "../../utils/logger";
import QueryBuilder from "../../utils/queryBuilder";
import { categorySearchableFields } from "./category.constant";
import { Category } from "./category.model";
import { WorkShop } from "../workshop/workshop.model";
const createCategory = async (payload) => {
    if (typeof payload.name !== "string") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid category name");
    }
    const existingCategory = await Category.findOne({
        name: { $eq: payload.name },
    });
    if (existingCategory) {
        throw new AppError(StatusCodes.BAD_REQUEST, "A Category with this name already exists");
    }
    const slug = payload.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const category = await Category.create({ ...payload, slug });
    return category;
};
const getSingleCategory = async (slug) => {
    const category = await Category.findOne({ slug });
    return {
        data: category,
    };
};
const getAllCategories = async (query) => {
    const queryBuilder = new QueryBuilder(Category.find(), query);
    const categoriesData = queryBuilder
        .search(categorySearchableFields)
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
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
    }
    // 1. Validation: Name specific checks
    // We copy to a local variable to handle trimming without mutating the original payload
    let payloadName = payload.name;
    if (payloadName !== undefined) {
        if (typeof payloadName !== "string") {
            throw new AppError(StatusCodes.BAD_REQUEST, "Invalid category name");
        }
        const trimmedName = payloadName.trim();
        if (trimmedName.length === 0) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Category name cannot be empty");
        }
        // Update our local variable to the clean version
        payloadName = trimmedName;
    }
    // 2. Duplicate Check: Only run if name is being updated.
    if (payloadName) {
        const duplicateCategory = await Category.findOne({
            name: { $eq: payloadName },
            _id: { $ne: id },
        });
        if (duplicateCategory) {
            throw new AppError(StatusCodes.BAD_REQUEST, "A Category with this name already exists");
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
    const updatedCategory = await Category.findByIdAndUpdate(id, { $set: updateData }, {
        returnDocument: "after",
        runValidators: true,
    });
    if (!updatedCategory) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
    }
    if (payload.thumbnail && existingCategory.thumbnail) {
        try {
            await deleteImageFromCloudinary(existingCategory.thumbnail);
        }
        catch (error) {
            // Log error but don't fail the request - category update already succeeded
            logger.error({
                message: "Failed to delete old thumbnail from Cloudinary",
                err: error,
            });
        }
    }
    return updatedCategory;
};
const deleteCategory = async (id) => {
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
    }
    // Guard: Prevent deleting a category that has associated workshops
    const workshopCount = await WorkShop.countDocuments({
        category: { $eq: id },
        isDeleted: { $ne: true },
    });
    if (workshopCount > 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, `Cannot delete category: ${workshopCount} workshop(s) are still using it. Reassign or delete them first.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await existingCategory.softDelete();
    return null;
};
const CategoryService = {
    createCategory,
    getSingleCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
};
export default CategoryService;
