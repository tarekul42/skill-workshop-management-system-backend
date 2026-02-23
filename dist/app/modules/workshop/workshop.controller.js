"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const workshop_service_1 = __importDefault(require("./workshop.service"));
const createLevel = (0, catchAsync_1.default)(async (req, res) => {
    const { name } = req.body;
    const result = await workshop_service_1.default.createLevel({ name });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Level created successfully",
        data: result,
    });
});
const getSingleLevel = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await workshop_service_1.default.getSingleLevel(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Level fetched successfully",
        data: result,
    });
});
const getAllLevels = (0, catchAsync_1.default)(async (req, res) => {
    const query = {};
    for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === "string") {
            query[key] = value;
        }
    }
    const result = await workshop_service_1.default.getAllLevels(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Levels fetched successfully",
        data: result,
    });
});
const updateLevel = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const result = await workshop_service_1.default.updateLevel(id, { name });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Level updated successfully",
        data: result,
    });
});
const deleteLevel = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await workshop_service_1.default.deleteLevel(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Level deleted successfully",
        data: result,
    });
});
const createWorkshop = (0, catchAsync_1.default)(async (req, res) => {
    const result = await workshop_service_1.default.createWorkshop(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Workshop created successfully",
        data: result,
    });
});
const getSingleWorkshop = (0, catchAsync_1.default)(async (req, res) => {
    const slug = req.params.slug;
    const result = await workshop_service_1.default.getSingleWorkshop(slug);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Workshop fetched successfully",
        data: result,
    });
});
const getAllWorkshops = (0, catchAsync_1.default)(async (req, res) => {
    const query = {};
    for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === "string") {
            query[key] = value;
        }
    }
    const result = await workshop_service_1.default.getAllWorkshops(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Workshops fetched successfully",
        data: result.data,
        meta: result.meta,
    });
});
const updateWorkshop = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await workshop_service_1.default.updateWorkshop(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Workshop updated successfully",
        data: result,
    });
});
const deleteWorkshop = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const result = await workshop_service_1.default.deleteWorkshop(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Workshop deleted successfully",
        data: result,
    });
});
const WorkshopController = {
    createLevel,
    getSingleLevel,
    getAllLevels,
    updateLevel,
    deleteLevel,
    createWorkshop,
    getSingleWorkshop,
    getAllWorkshops,
    updateWorkshop,
    deleteWorkshop,
};
exports.default = WorkshopController;
