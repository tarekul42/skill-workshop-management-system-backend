"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const category_service_1 = __importDefault(require("./category.service"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createCategory = (0, catchAsync_1.default)(async (req, res) => {
    const result = await category_service_1.default.createCategory(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Category created successfully",
        data: result,
    });
});
const getSingleCategory = (0, catchAsync_1.default)(async (req, res) => {
    const slug = req.params.slug;
    const result = await category_service_1.default.getSingleCategory(slug);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Category fetched successfully",
        data: result,
    });
});
const getAllCategories = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const result = await category_service_1.default.getAllCategories(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Categories fetched successfully",
        data: result.data,
        meta: result.meta,
    });
});
const updateCategory = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await category_service_1.default.updateCategory(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Category updated successfully",
        data: result,
    });
});
const deleteCategory = (0, catchAsync_1.default)(async (req, res) => {
    const result = await category_service_1.default.deleteCategory(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
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
exports.default = CategoryController;
