import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError";
import logger from "../utils/logger";
import envVariables from "./env";
cloudinary.config({
    cloud_name: envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
});
const uploadBufferToCloudinary = async (buffer, fileName) => {
    return new Promise((resolve, reject) => {
        const public_id = `${fileName}-${Date.now()}`;
        cloudinary.uploader
            .upload_stream({
            resource_type: "auto",
            public_id: public_id,
            folder: "pdf",
        }, (error, result) => {
            if (error) {
                return reject(new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Cloudinary upload failed", error.message));
            }
            resolve(result);
        })
            .end(buffer);
    });
};
const deleteImageFromCloudinary = async (url) => {
    try {
        const regex = /\/v\d+\/([^/]+)\.(jpg|jpeg|png|gif|webp)$/i;
        const match = url.match(regex);
        if (match && match[1]) {
            const publicId = match[1];
            await cloudinary.uploader.destroy(publicId);
        }
        else {
            throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Cloudinary URL format", `Could not extract public ID from URL: ${url}`);
        }
    }
    catch (err) {
        logger.warn({ msg: "Cloudinary cleanup failed", error: String(err) });
    }
};
const cloudinaryUpload = cloudinary;
export { cloudinaryUpload, deleteImageFromCloudinary, uploadBufferToCloudinary, };
