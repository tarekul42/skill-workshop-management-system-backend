import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import WorkshopService from "./workshop.service";

const createLevel = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;

  const result = await WorkshopService.createLevel({ name });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Level created successfully",
    data: result,
  });
});

const getAllLevels = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopService.getAllLevels();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Levels fetched successfully",
    data: result,
  });
});

const updateLevel = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  const result = await WorkshopService.updateLevel(id, { name });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Level updated successfully",
    data: result,
  });
});

const deleteLevel = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await WorkshopService.deleteLevel(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Level deleted successfully",
    data: result,
  });
});

const createWorkshop = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopService.createWorkshop(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Workshop created successfully",
    data: result,
  });
});

const getAllWorkshops = catchAsync(async (req: Request, res: Response) => {
  const query: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") {
      query[key] = value;
    }
  }

  const result = await WorkshopService.getAllWorkshops(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Workshops fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WorkshopService.updateWorkshop(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Workshop updated successfully",
    data: result,
  });
});

const deleteWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await WorkshopService.deleteWorkshop(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Workshop deleted successfully",
    data: result,
  });
});

const WorkshopController = {
  createLevel,
  getAllLevels,
  updateLevel,
  deleteLevel,
  createWorkshop,
  getAllWorkshops,
  updateWorkshop,
  deleteWorkshop,
};

export default WorkshopController;
