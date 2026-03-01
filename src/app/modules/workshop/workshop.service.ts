/* eslint-disable no-console */
import { StatusCodes } from "http-status-codes";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import QueryBuilder from "../../utils/queryBuilder";
import {
  levelSearchableFields,
  workshopSearchableFields,
} from "./workshop.constant";
import { ILevel, IWorkshop } from "./workshop.interface";
import { Level, WorkShop } from "./workshop.model";

const createLevel = async (payload: ILevel) => {
  if (!payload || typeof payload.name !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid level name");
  }

  const existingLevel = await Level.findOne({ name: { $eq: payload.name } });

  if (existingLevel) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Level already exists");
  }

  const level = await Level.create(payload);

  return level;
};

const getSingleLevel = async (id: string) => {
  const level = await Level.findById(id);

  if (!level) {
    throw new AppError(StatusCodes.NOT_FOUND, "Level not found");
  }

  return {
    data: level,
  };
};

const getAllLevels = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Level.find(), query);

  const levels = queryBuilder
    .search(levelSearchableFields)
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

const updateLevel = async (id: string, payload: Partial<ILevel>) => {
  const existingLevel = await Level.findById(id);

  if (!existingLevel) {
    throw new AppError(StatusCodes.NOT_FOUND, "Level not found");
  }

  if (payload.name && payload.name !== existingLevel.name) {
    if (typeof payload.name !== "string") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid level name");
    }

    const duplicateLevel = await Level.findOne({ name: { $eq: payload.name } });

    if (duplicateLevel) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Level with this name already exists",
      );
    }
  }

  const updateData: Partial<ILevel> = {};
  if (typeof payload.name === "string") {
    updateData.name = payload.name;
  }

  const updatedLevel = await Level.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return updatedLevel;
};

const deleteLevel = async (id: string) => {
  const existingLevel = await Level.findById(id);

  if (!existingLevel) {
    throw new AppError(StatusCodes.NOT_FOUND, "Level not found");
  }

  return await Level.findByIdAndDelete(id);
};

const createWorkshop = async (payload: IWorkshop) => {
  if (typeof payload.title !== "string") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Workshop title must be a string",
    );
  }

  const existingWorkshop = await WorkShop.findOne({
    title: { $eq: payload.title },
  });

  if (existingWorkshop) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Workshop already exists");
  }

  const workshop = await WorkShop.create(payload);

  return workshop;
};

const getSingleWorkshop = async (slug: string) => {
  const workshop = await WorkShop.findOne({ slug: { $eq: slug } });

  if (!workshop) {
    throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found");
  }

  return {
    data: workshop,
  };
};

const getAllWorkshops = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(WorkShop.find(), query);

  const workshops = queryBuilder
    .search(workshopSearchableFields)
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

const updateWorkshop = async (id: string, payload: Partial<IWorkshop>) => {
  const existingWorkshop = await WorkShop.findById(id);

  if (!existingWorkshop) {
    throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found");
  }

  const title = payload.title;

  if (title && typeof title !== "string") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid title format");
  }

  // Build a safe update object from a whitelist of allowed fields
  const safePayload: Partial<IWorkshop> = {};

  if (typeof payload.title === "string") {
    safePayload.title = payload.title;
  }

  if (safePayload.title && safePayload.title !== existingWorkshop.title) {
    const duplicateWorkshop = await WorkShop.findOne({
      title: safePayload.title,
    });

    if (duplicateWorkshop) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Workshop with this title already exists",
      );
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

  if (
    payload.images &&
    payload.images.length > 0 &&
    existingWorkshop.images &&
    existingWorkshop.images.length > 0
  ) {
    payload.images = [...payload.images, ...existingWorkshop.images];
  }

  if (
    payload.deleteImages &&
    payload.deleteImages.length > 0 &&
    existingWorkshop.images &&
    existingWorkshop.images.length > 0
  ) {
    const restDBImages = existingWorkshop.images.filter(
      (imageUrl) => !payload.deleteImages?.includes(imageUrl),
    );

    const updatedPayloadImages = (payload.images || [])
      .filter((imageUrl) => !payload.deleteImages?.includes(imageUrl))
      .filter((imageUrl) => !restDBImages.includes(imageUrl));

    payload.images = [...restDBImages, ...updatedPayloadImages];
  }

  if (payload.images) {
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const validImages = payload.images.filter((img) => isValidUrl(img));

    if (validImages.length === 0 && payload.images.length > 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid images format",
        "Images must be valid URLs",
      );
    }

    safePayload.images = validImages;
  }

  const updatedWorkshop = await WorkShop.findByIdAndUpdate(id, safePayload, {
    new: true,
  });

  if (
    payload.deleteImages &&
    payload.deleteImages.length > 0 &&
    existingWorkshop.images &&
    existingWorkshop.images.length > 0
  ) {
    // Only delete images that actually belonged to this workshop
    const validDeletions = payload.deleteImages.filter((url) =>
      existingWorkshop.images?.includes(url),
    );

    const results = await Promise.allSettled(
      validDeletions.map((url) => deleteImageFromCloudinary(url)),
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(
        `Failed to delete ${failures.length} images from Cloudinary`,
      );
    }
  }

  return updatedWorkshop;
};

const deleteWorkshop = async (id: string) => {
  const existingWorkshop = await WorkShop.findById(id);

  if (!existingWorkshop) {
    throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found");
  }
  return await WorkShop.findByIdAndDelete(id);
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

export default WorkshopService;
