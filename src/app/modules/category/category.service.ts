import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategory = async (payload: ICategory) => {
  if (typeof payload.name !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid category name");
  }

  const existingCategory = await Category.findOne({
    name: { $eq: payload.name },
  });

  if (existingCategory) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A Category with this name already exists",
    );
  }

  if (payload.name !== undefined && typeof payload.name !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid category name");
  }

  const category = await Category.create(payload);
  return category;
};

const getAllCategories = async () => {
  const categories = await Category.find({});
  const totalCategories = await Category.countDocuments();

  return {
    data: categories,
    meta: {
      total: totalCategories,
    },
  };
};

const getSingleCategory = async (slug: string) => {
  const category = await Category.findOne({ slug });
  return {
    data: category,
  };
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  // 1. Validation: Name specific checks
  // We copy to a local variable to handle trimming without mutating the original payload
  let payloadName = payload.name;

  if (payloadName !== undefined) {
    if (typeof payloadName !== "string") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid category name");
    }

    const trimmedName = payloadName.trim();

    if (trimmedName.length === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Category name cannot be empty",
      );
    }

    // Update our local variable to the clean version
    payloadName = trimmedName;
  }

  // 2. Duplicate Check: Only run if name is being updated.
  if (payloadName) {
    const duplicateCategory = await Category.findOne({
      name: payloadName,
      _id: { $ne: id },
    });

    if (duplicateCategory) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "A Category with this name already exists",
      );
    }
  }

  // 3. Prepare update data
  const updateData: Partial<ICategory> = {};

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
  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedCategory) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return updatedCategory;
};

const deleteCategory = async (id: string) => {
  await Category.findByIdAndDelete(id);
  return null;
};

const CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};

export default CategoryService;
