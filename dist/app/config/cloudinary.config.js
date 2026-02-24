"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = exports.cloudinaryUpload = void 0;
const cloudinary_1 = require("cloudinary");
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const env_1 = __importDefault(require("./env"));
cloudinary_1.v2.config({
    cloud_name: env_1.default.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.default.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: env_1.default.CLOUDINARY.CLOUDINARY_API_SECRET,
});
const deleteImageFromCloudinary = async (url) => {
    try {
        const regex = /\/v\d+\/([^/]+)\.(jpg|jpeg|png|gif|webp)$/i;
        const match = url.match(regex);
        if (match && match[1]) {
            const publicId = match[1];
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        else {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Cloudinary URL format", `Could not extract public ID from URL: ${url}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (err) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Cloudinary image deletion failed", err.message);
    }
};
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
const cloudinaryUpload = cloudinary_1.v2;
exports.cloudinaryUpload = cloudinaryUpload;
