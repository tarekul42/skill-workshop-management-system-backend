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
  if (payload.name !== undefined && typeof payload.name !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid category name");
  }

  const existingCategory = await Category.findById(id);

  if (!existingCategory) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  const duplicateCategory = await Category.findOne({
    name: payload.name !== undefined ? { $eq: payload.name } : undefined,
    _id: { $ne: id },
  });

  if (duplicateCategory) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A Category with this name already exists",
    );
  }

  const updatedCategory = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

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
