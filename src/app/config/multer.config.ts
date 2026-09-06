import { Request } from "express";
import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import { cloudinaryUpload } from "./cloudinary.config.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MAGIC_TYPES = ["jpg", "png", "webp"];

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (_req, file) => {
    const fileName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/\./g, "-")
      .replace(/[^a-z0-9.-]/g, "");

    const parts = file.originalname.split(".");
    const extension = parts.length > 1 ? parts.pop() : "";

    const uniqueFileName =
      Math.random().toString(36).substring(2) +
      "-" +
      Date.now() +
      "-" +
      fileName +
      (extension ? "." + extension : "");

    return {
      folder: "uploads",
      public_id: uniqueFileName,
      resource_type: "image",
    };
  },
});

const fileFilter = async (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`));
    return;
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`));
    return;
  }

  // Magic-byte verification: buffer the first 4KB and verify actual file type
  const chunks: Buffer[] = [];
  const stream = file.stream;
  if (stream && typeof stream.on === "function") {
    await new Promise<void>((resolve) => {
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
        if (Buffer.concat(chunks).length >= 4096) {
          stream.destroy();
          resolve();
        }
      });
      stream.on("end", resolve);
      stream.on("error", resolve);
    });
    const buf = Buffer.concat(chunks);
    const detected = await fileTypeFromBuffer(buf);
    if (detected && !ALLOWED_MAGIC_TYPES.includes(detected.ext)) {
      cb(new Error(`File content does not match declared type. Detected: ${detected.ext}`));
      return;
    }
  }

  cb(null, true);
};

const multerUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter as unknown as multer.Options["fileFilter"],
});

export default multerUpload;
