import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ICategory } from "./category.interface";
import CategoryService from "./category.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const payload = {
    ...req.body,
    ...(req.file?.path && { thumbnail: req.file.path }),
  } as ICategory;

  const result = await CategoryService.createCategory(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const result = await CategoryService.getSingleCategory(slug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category fetched successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await CategoryService.getAllCategories(
    query as Record<string, string>,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const payload: Partial<ICategory> = {
    ...req.body,
    ...(req.file?.path && { thumbnail: req.file.path }),
  };

  const result = await CategoryService.updateCategory(id, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const result = await CategoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

const CategoryController = {
  createCategory,
  getSingleCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};

export default CategoryController;
