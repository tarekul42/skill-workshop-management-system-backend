/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import AppError from "../errorHelpers/AppError";
import envVariables from "./env";
import Stream from "stream";

cloudinary.config({
  cloud_name: envVariables.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVariables.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVariables.CLOUDINARY.CLOUDINARY_API_SECRET,
});

const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      const public_id = `pdf/${fileName}-${Date.now()}`;

      const bufferStream = new Stream.PassThrough();
      bufferStream.end(buffer);

      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            public_id: public_id,
            folder: "pdf",
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          },
        )
        .end(buffer);
    });
  } catch (error: any) {
    console.log(error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Cloudinary upload failed",
      error.message,
    );
  }
};

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
  } catch (err: any) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Cloudinary image deletion failed",
      err.message,
    );
  }
};

const cloudinaryUpload = cloudinary;

export {
  cloudinaryUpload,
  uploadBufferToCloudinary,
  deleteImageFromCloudinary,
};
