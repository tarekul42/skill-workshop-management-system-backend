import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ILevel, IWorkshop } from "./workshop.interface";
import { Level, WorkShop } from "./workshop.model";
import QueryBuilder from "../../utils/queryBuilder";
import { workshopSearchableFields } from "./workshop.constant";

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

const getAllLevels = async () => {
  return await Level.find();
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

  const updatedWorkshop = await WorkShop.findByIdAndUpdate(id, safePayload, {
    new: true,
  });

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
  getAllLevels,
  updateLevel,
  deleteLevel,
  createWorkshop,
  getAllWorkshops,
  updateWorkshop,
  deleteWorkshop,
};

export default WorkshopService;
