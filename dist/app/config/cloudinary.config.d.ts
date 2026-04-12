import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
declare const uploadBufferToCloudinary: (buffer: Buffer, fileName: string) => Promise<UploadApiResponse | undefined>;
declare const deleteImageFromCloudinary: (url: string) => Promise<void>;
declare const cloudinaryUpload: typeof cloudinary;
export { cloudinaryUpload, deleteImageFromCloudinary, uploadBufferToCloudinary, };
