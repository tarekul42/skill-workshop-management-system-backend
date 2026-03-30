"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const redis_config_1 = require("../../config/redis.config");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const auditLogger_1 = __importDefault(require("../../utils/auditLogger"));
const logger_1 = __importDefault(require("../../utils/logger"));
const queryBuilder_1 = __importDefault(require("../../utils/queryBuilder"));
const audit_interface_1 = require("../audit/audit.interface");
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
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.CREATE,
        collectionName: "Level",
        documentId: level._id,
    });
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
        returnDocument: "after",
    });
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.UPDATE,
        collectionName: "Level",
        documentId: id,
        changes: updateData,
    });
    return updatedLevel;
};
const deleteLevel = async (id) => {
    const existingLevel = await workshop_model_1.Level.findById(id);
    if (!existingLevel) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Level not found");
    }
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.DELETE,
        collectionName: "Level",
        documentId: existingLevel._id,
    });
    return await existingLevel.softDelete();
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
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.CREATE,
        collectionName: "WorkShop",
        documentId: workshop._id,
    });
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
    const cacheKey = `workshops:list:${JSON.stringify(query)}`;
    const cachedData = await redis_config_1.redisClient.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
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
    const result = {
        data,
        meta,
    };
    await redis_config_1.redisClient.set(cacheKey, JSON.stringify(result), {
        expiration: {
            type: "EX",
            value: 60, // cache for 60 seconds
        },
    });
    return result;
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
            title: { $eq: safePayload.title },
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
        if (typeof payload.startDate === "string") {
            safePayload.startDate = new Date(payload.startDate);
        }
        else if (payload.startDate instanceof Date) {
            safePayload.startDate = payload.startDate;
        }
        else {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid startDate format");
        }
    }
    if (payload.endDate !== undefined) {
        if (typeof payload.endDate === "string") {
            safePayload.endDate = new Date(payload.endDate);
        }
        else if (payload.endDate instanceof Date) {
            safePayload.endDate = payload.endDate;
        }
        else {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid endDate format");
        }
    }
    if (Array.isArray(payload.whatYouLearn)) {
        const sanitizedWhatYouLearn = payload.whatYouLearn.filter((item) => typeof item === "string");
        if (sanitizedWhatYouLearn.length !== payload.whatYouLearn.length &&
            payload.whatYouLearn.length > 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid whatYouLearn format");
        }
        safePayload.whatYouLearn = sanitizedWhatYouLearn;
    }
    if (Array.isArray(payload.prerequisites)) {
        const sanitizedPrerequisites = payload.prerequisites.filter((item) => typeof item === "string");
        if (sanitizedPrerequisites.length !== payload.prerequisites.length &&
            payload.prerequisites.length > 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid prerequisites format");
        }
        safePayload.prerequisites = sanitizedPrerequisites;
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
    // Handle image updates (merging, deleting, and validating)
    const { finalImages, imagesToDelete } = processWorkshopImages(existingWorkshop.images || [], payload.images, payload.deleteImages);
    if (payload.images || payload.deleteImages) {
        safePayload.images = finalImages;
    }
    const updatedWorkshop = await workshop_model_1.WorkShop.findByIdAndUpdate(id, safePayload, {
        returnDocument: "after",
    });
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.UPDATE,
        collectionName: "WorkShop",
        documentId: id,
        changes: safePayload,
    });
    if (imagesToDelete.length > 0) {
        const results = await Promise.allSettled(imagesToDelete.map((url) => (0, cloudinary_config_1.deleteImageFromCloudinary)(url)));
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
            logger_1.default.error({
                message: `Failed to delete ${failures.length} images from Cloudinary`,
            });
        }
    }
    return updatedWorkshop;
};
/**
 * Helper to process workshop image updates.
 * Handles merging new images, filtering deletions, and URL validation.
 */
const processWorkshopImages = (existingImages, newImages, deleteImages) => {
    const imagesToDelete = [];
    let currentImages = [...existingImages];
    // 1. Identify images to delete (must exist in current list)
    if (deleteImages && deleteImages.length > 0) {
        deleteImages.forEach((url) => {
            if (currentImages.includes(url)) {
                imagesToDelete.push(url);
            }
        });
        currentImages = currentImages.filter((img) => !imagesToDelete.includes(img));
    }
    // 2. Add new images (avoid duplicates and validate URLs)
    if (newImages && newImages.length > 0) {
        const isValidUrl = (url) => {
            try {
                new URL(url);
                return true;
            }
            catch {
                return false;
            }
        };
        const validNewImages = newImages
            .filter((img) => typeof img === "string" && isValidUrl(img))
            .filter((img) => !currentImages.includes(img));
        currentImages = [...currentImages, ...validNewImages];
    }
    return {
        finalImages: currentImages,
        imagesToDelete,
    };
};
const deleteWorkshop = async (id) => {
    const existingWorkshop = await workshop_model_1.WorkShop.findById(id);
    if (!existingWorkshop) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Workshop not found");
    }
    await (0, auditLogger_1.default)({
        action: audit_interface_1.AuditAction.DELETE,
        collectionName: "WorkShop",
        documentId: existingWorkshop._id,
    });
    return await existingWorkshop.softDelete();
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
