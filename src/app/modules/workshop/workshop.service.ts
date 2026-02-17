import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ILevel, IWorkshop } from "./workshop.interface";
import { Level, WorkShop } from "./workshop.model";
import QueryBuilder from "../../utils/queryBuilder";
import { workshopSearchableFields } from "./workshop.constant";

const createLevel = async (payload: ILevel) => {
  const existingLevel = await Level.findOne({ name: payload.name });

  if (existingLevel) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Level already exists");
  }

  const level = await Level.create(payload);

  return level;
};

const getAllLevels = async () => {
  return await Level.find();
};

const updateLevel = async (id: string, payload: ILevel) => {
  const existingLevel = await Level.findById(id);

  if (!existingLevel) {
    throw new AppError(StatusCodes.NOT_FOUND, "Level not found");
  }

  if (payload.name && payload.name !== existingLevel.name) {
    const duplicateLevel = await Level.findOne({ name: payload.name });
    if (duplicateLevel) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Level with this name already exists",
      );
    }
  }

  const updatedLevel = await Level.findByIdAndUpdate(id, payload, {
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
  const existingWorkshop = await WorkShop.findOne({ title: payload.title });

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

  if (payload.title && payload.title !== existingWorkshop.title) {
    const duplicateWorkshop = await WorkShop.findOne({ title: payload.title });
    if (duplicateWorkshop) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Workshop with this title already exists",
      );
    }
  }

  const updatedWorkshop = await WorkShop.findByIdAndUpdate(id, payload, {
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
