import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { parseStringParam } from "../../utils/parseParams";
import WorkshopService from "./workshop.service";
const createLevel = catchAsync(async (req, res) => {
    const { name } = req.body;
    const result = await WorkshopService.createLevel({ name });
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Level created successfully",
        data: result,
    });
});
const getSingleLevel = catchAsync(async (req, res) => {
    const id = parseStringParam(req.params.id, "id");
    const result = await WorkshopService.getSingleLevel(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Level fetched successfully",
        data: result,
    });
});
const getAllLevels = catchAsync(async (req, res) => {
    const query = {};
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
const updateLevel = catchAsync(async (req, res) => {
    const id = parseStringParam(req.params.id, "id");
    const { name } = req.body;
    const result = await WorkshopService.updateLevel(id, { name });
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Level updated successfully",
        data: result,
    });
});
const deleteLevel = catchAsync(async (req, res) => {
    const id = parseStringParam(req.params.id, "id");
    const result = await WorkshopService.deleteLevel(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Level deleted successfully",
        data: null,
    });
});
const createWorkshop = catchAsync(async (req, res) => {
    const payload = {
        ...req.body,
        images: (req.files ?? []).map((file) => file.path),
    };
    const result = await WorkshopService.createWorkshop(payload);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Workshop created successfully",
        data: result,
    });
});
const getSingleWorkshop = catchAsync(async (req, res) => {
    const slug = parseStringParam(req.params.slug, "slug");
    const result = await WorkshopService.getSingleWorkshop(slug);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Workshop fetched successfully",
        data: result,
    });
});
const getAllWorkshops = catchAsync(async (req, res) => {
    const query = {};
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
const updateWorkshop = catchAsync(async (req, res) => {
    const id = parseStringParam(req.params.id, "id");
    const files = req.files;
    const payload = {
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
const deleteWorkshop = catchAsync(async (req, res) => {
    const id = parseStringParam(req.params.id, "id");
    const result = await WorkshopService.deleteWorkshop(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Workshop deleted successfully",
        data: null,
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
