"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const workshop_model_1 = require("./workshop.model");
const queryBuilder_1 = __importDefault(require("../../utils/queryBuilder"));
const workshop_constant_1 = require("./workshop.constant");
const createLevel = async (payload) => {
    if (!payload || typeof payload.name !== "string") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid level name");
    }
    const existingLevel = await workshop_model_1.Level.findOne({ name: { $eq: payload.name } });
    if (existingLevel) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Level already exists");
    }
    const level = await workshop_model_1.Level.create(payload);
    return level;
};
const getSingleLevel = async (id) => {
    const level = await workshop_model_1.Level.findById(id);
    if (!level) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Level not found");
    }
    return {
        data: level,
    };
};
const getAllLevels = async (query) => {
    const queryBuilder = new queryBuilder_1.default(workshop_model_1.Level.find(), query);
    const levels = queryBuilder
        .search(workshop_constant_1.levelSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();
    const [data, meta] = await Promise.all([
        levels.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
};
const updateLevel = async (id, payload) => {
    const existingLevel = await workshop_model_1.Level.findById(id);
    if (!existingLevel) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Level not found");
    }
    if (payload.name && payload.name !== existingLevel.name) {
        if (typeof payload.name !== "string") {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid level name");
        }
        const duplicateLevel = await workshop_model_1.Level.findOne({ name: { $eq: payload.name } });
        if (duplicateLevel) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Level with this name already exists");
        }
    }
    const updateData = {};
    if (typeof payload.name === "string") {
        updateData.name = payload.name;
    }
    const updatedLevel = await workshop_model_1.Level.findByIdAndUpdate(id, updateData, {
        new: true,
    });
    return updatedLevel;
};
const deleteLevel = async (id) => {
    const existingLevel = await workshop_model_1.Level.findById(id);
    if (!existingLevel) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Level not found");
    }
    return await workshop_model_1.Level.findByIdAndDelete(id);
};
const createWorkshop = async (payload) => {
    if (typeof payload.title !== "string") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop title must be a string");
    }
    const existingWorkshop = await workshop_model_1.WorkShop.findOne({
        title: { $eq: payload.title },
    });
    if (existingWorkshop) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop already exists");
    }
    const workshop = await workshop_model_1.WorkShop.create(payload);
    return workshop;
};
const getSingleWorkshop = async (slug) => {
    const workshop = await workshop_model_1.WorkShop.findOne({ slug: { $eq: slug } });
    if (!workshop) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Workshop not found");
    }
    return {
        data: workshop,
    };
};
const getAllWorkshops = async (query) => {
    const queryBuilder = new queryBuilder_1.default(workshop_model_1.WorkShop.find(), query);
    const workshops = queryBuilder
        .search(workshop_constant_1.workshopSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();
    const [data, meta] = await Promise.all([
        workshops.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
};
const updateWorkshop = async (id, payload) => {
    const existingWorkshop = await workshop_model_1.WorkShop.findById(id);
    if (!existingWorkshop) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Workshop not found");
    }
    const title = payload.title;
    if (title && typeof title !== "string") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid title format");
    }
    // Build a safe update object from a whitelist of allowed fields
    const safePayload = {};
    if (typeof payload.title === "string") {
        safePayload.title = payload.title;
    }
    if (safePayload.title && safePayload.title !== existingWorkshop.title) {
        const duplicateWorkshop = await workshop_model_1.WorkShop.findOne({
            title: safePayload.title,
        });
        if (duplicateWorkshop) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop with this title already exists");
        }
    }
    const updatedWorkshop = await workshop_model_1.WorkShop.findByIdAndUpdate(id, safePayload, {
        new: true,
    });
    return updatedWorkshop;
};
const deleteWorkshop = async (id) => {
    const existingWorkshop = await workshop_model_1.WorkShop.findById(id);
    if (!existingWorkshop) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Workshop not found");
    }
    return await workshop_model_1.WorkShop.findByIdAndDelete(id);
};
const WorkshopService = {
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
exports.default = WorkshopService;
