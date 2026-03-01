"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const http_status_codes_1 = require("http-status-codes");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const queryBuilder_1 = __importDefault(require("../../utils/queryBuilder"));
const workshop_constant_1 = require("./workshop.constant");
const workshop_model_1 = require("./workshop.model");
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
    if (typeof payload.description === "string") {
        safePayload.description = payload.description;
    }
    if (typeof payload.location === "string") {
        safePayload.location = payload.location;
    }
    if (typeof payload.price === "number") {
        safePayload.price = payload.price;
    }
    if (payload.startDate !== undefined) {
        safePayload.startDate = payload.startDate;
    }
    if (payload.endDate !== undefined) {
        safePayload.endDate = payload.endDate;
    }
    if (Array.isArray(payload.whatYouLearn)) {
        safePayload.whatYouLearn = payload.whatYouLearn;
    }
    if (Array.isArray(payload.prerequisites)) {
        safePayload.prerequisites = payload.prerequisites;
    }
    if (Array.isArray(payload.benefits)) {
        safePayload.benefits = payload.benefits;
    }
    if (Array.isArray(payload.syllabus)) {
        safePayload.syllabus = payload.syllabus;
    }
    if (typeof payload.maxSeats === "number") {
        safePayload.maxSeats = payload.maxSeats;
    }
    if (typeof payload.minAge === "number") {
        safePayload.minAge = payload.minAge;
    }
    if (payload.category !== undefined) {
        safePayload.category = payload.category;
    }
    if (payload.level !== undefined) {
        safePayload.level = payload.level;
    }
    if (payload.images &&
        payload.images.length > 0 &&
        existingWorkshop.images &&
        existingWorkshop.images.length > 0) {
        payload.images = [...payload.images, ...existingWorkshop.images];
    }
    if (payload.deleteImages &&
        payload.deleteImages.length > 0 &&
        existingWorkshop.images &&
        existingWorkshop.images.length > 0) {
        const restDBImages = existingWorkshop.images.filter((imageUrl) => !payload.deleteImages?.includes(imageUrl));
        const updatedPayloadImages = (payload.images || [])
            .filter((imageUrl) => !payload.deleteImages?.includes(imageUrl))
            .filter((imageUrl) => !restDBImages.includes(imageUrl));
        payload.images = [...restDBImages, ...updatedPayloadImages];
    }
    if (payload.images) {
        const isValidUrl = (url) => {
            try {
                new URL(url);
                return true;
            }
            catch {
                return false;
            }
        };
        const validImages = payload.images.filter((img) => isValidUrl(img));
        if (validImages.length === 0 && payload.images.length > 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid images format", "Images must be valid URLs");
        }
        safePayload.images = validImages;
    }
    const updatedWorkshop = await workshop_model_1.WorkShop.findByIdAndUpdate(id, safePayload, {
        new: true,
    });
    if (payload.deleteImages &&
        payload.deleteImages.length > 0 &&
        existingWorkshop.images &&
        existingWorkshop.images.length > 0) {
        // Only delete images that actually belonged to this workshop
        const validDeletions = payload.deleteImages.filter((url) => existingWorkshop.images?.includes(url));
        const results = await Promise.allSettled(validDeletions.map((url) => (0, cloudinary_config_1.deleteImageFromCloudinary)(url)));
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
            console.error(`Failed to delete ${failures.length} images from Cloudinary`);
        }
    }
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
