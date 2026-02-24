import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError";
import envVariables from "./env";

cloudinary.config({
  cloud_name: envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
});

const deleteImageFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/([^/]+)\.(jpg|jpeg|png|gif|webp)$/i;
    const match = url.match(regex);

    if (match && match[1]) {
      const publicId = match[1];

      await cloudinary.uploader.destroy(publicId);
    } else {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid Cloudinary URL format",
        `Could not extract public ID from URL: ${url}`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Cloudinary image deletion failed",
      err.message,
    );
  }
};

const cloudinaryUpload = cloudinary;

export { cloudinaryUpload, deleteImageFromCloudinary };
