import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import WorkshopService from "./workshop.service";
import { IWorkshop } from "./workshop.interface";

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

const getSingleLevel = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await WorkshopService.getSingleLevel(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Level fetched successfully",
    data: result,
  });
});

const getAllLevels = catchAsync(async (req: Request, res: Response) => {
  const query: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") {
      query[key] = value;
    }
  }

  const result = await WorkshopService.getAllLevels(query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Levels fetched successfully",
    data: result,
  });
});

const updateLevel = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
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
  const id = req.params.id as string;

  const result = await WorkshopService.deleteLevel(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Level deleted successfully",
    data: result,
  });
});

const createWorkshop = catchAsync(async (req: Request, res: Response) => {
  const payload: IWorkshop = {
    ...req.body,
    images: ((req.files as Express.Multer.File[]) ?? []).map(
      (file) => file.path,
    ),
  };

  const result = await WorkshopService.createWorkshop(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Workshop created successfully",
    data: result,
  });
});

const getSingleWorkshop = catchAsync(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  const result = await WorkshopService.getSingleWorkshop(slug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Workshop fetched successfully",
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
  const id = req.params.id as string;

  const files = req.files as Express.Multer.File[] | undefined;

  const payload: Partial<IWorkshop> = {
    ...req.body,
    ...(files?.length && { images: files.map((file) => file.path) }),
  };

  const result = await WorkshopService.updateWorkshop(id, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Workshop updated successfully",
    data: result,
  });
});

const deleteWorkshop = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

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

export default WorkshopController;
